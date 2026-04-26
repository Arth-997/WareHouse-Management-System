import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const STATUS_ORDER = ['received', 'allocated', 'picked', 'packed', 'dispatched', 'delivered'];

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) { }

  private mapOrder(order: any) {
    return {
      id: order.id,
      orderRef: order.orderRef,
      internalRef: order.internalRef ?? undefined,
      warehouse: order.warehouse.code,
      warehouseId: order.warehouseId,
      client: order.client.name,
      clientId: order.clientId,
      customer: order.customer?.name ?? null,
      customerId: order.customerId,
      status: order.status,
      priority: order.priority,
      shippingMethod: order.shippingMethod,
      billingCategory: order.billingCategory,
      deliveryAddress: order.deliveryAddress,
      createdAt: order.createdAt.toISOString(),
      slaStartAt: order.slaStartAt ? order.slaStartAt.toISOString() : null,
      slaDeadlineAt: order.slaDeadlineAt ? order.slaDeadlineAt.toISOString() : null,
      slaBreached: order.slaBreached,
      slaWarningLeadHours: order.warehouse.slaWarningLeadHours,
      lines: (order.lines ?? []).map((l: any) => ({
        id: l.id,
        skuId: l.skuId,
        skuCode: l.sku?.skuCode ?? '',
        description: l.sku?.description ?? '',
        quantity: l.quantity,
        inventoryPositionId: l.inventoryPositionId,
      })),
    };
  }

  private async generateOrderRef(): Promise<string> {
    const year = new Date().getFullYear();
    const lastOrder = await this.prisma.order.findFirst({
      where: { orderRef: { startsWith: `ORD-${year}-` } },
      orderBy: { orderRef: 'desc' },
    });
    const lastNum = lastOrder ? parseInt(lastOrder.orderRef.split('-').pop() || '0', 10) : 0;
    return `ORD-${year}-${String(lastNum + 1).padStart(4, '0')}`;
  }

  private readonly orderInclude = {
    warehouse: true,
    client: true,
    customer: true,
    lines: { include: { sku: true } },
  };

  async create(data: {
    warehouseId: string;
    clientId: string;
    customerId?: string;
    priority: string;
    shippingMethod: string;
    billingCategory: string;
    deliveryAddress?: any;
    slaDurationHours?: number;
    lines: { skuId: string; quantity: number }[];
  }, userId: string) {
    if (!data.warehouseId || !data.clientId) {
      throw new BadRequestException('warehouseId and clientId are required');
    }
    if (!data.lines?.length) {
      throw new BadRequestException('At least one order line is required');
    }

    // Validate stock availability for each line
    const reservations: { positionId: string; quantity: number }[] = [];

    for (const line of data.lines) {
      if (line.quantity <= 0) throw new BadRequestException('Quantity must be > 0');

      const position = await this.prisma.inventoryPosition.findFirst({
        where: {
          warehouseId: data.warehouseId,
          clientId: data.clientId,
          skuId: line.skuId,
        },
      });

      if (!position) {
        throw new BadRequestException(`No inventory found for SKU ${line.skuId} in this warehouse`);
      }

      const available = position.quantityOnHand - position.quantityReserved;
      if (available < line.quantity) {
        throw new BadRequestException(
          `Insufficient stock for SKU. Available: ${available}, Requested: ${line.quantity}`,
        );
      }

      reservations.push({ positionId: position.id, quantity: line.quantity });
    }

    // Create order + reserve stock in a transaction-like flow
    const orderRef = await this.generateOrderRef();
    const now = new Date();
    const slaDuration = data.slaDurationHours ?? 24;
    const slaDeadline = new Date(now.getTime() + slaDuration * 3600_000);

    const order = await this.prisma.order.create({
      data: {
        orderRef,
        warehouseId: data.warehouseId,
        clientId: data.clientId,
        customerId: data.customerId || null,
        status: 'received',
        priority: data.priority || 'normal',
        shippingMethod: data.shippingMethod || 'standard',
        billingCategory: data.billingCategory || 'storage_handling',
        deliveryAddress: data.deliveryAddress || {},
        slaStartAt: now,
        slaDeadlineAt: slaDeadline,
        lines: {
          create: data.lines.map((l, idx) => ({
            skuId: l.skuId,
            quantity: l.quantity,
            inventoryPositionId: reservations[idx].positionId,
          })),
        },
      },
      include: this.orderInclude,
    });

    // Reserve stock for each line
    for (const res of reservations) {
      const pos = await this.prisma.inventoryPosition.findUnique({ where: { id: res.positionId } });
      await this.prisma.inventoryPosition.update({
        where: { id: res.positionId },
        data: { quantityReserved: { increment: res.quantity } },
      });

      await this.prisma.inventoryMovement.create({
        data: {
          movementType: 'reserve',
          referenceType: 'Order',
          referenceId: order.orderRef,
          quantityBefore: pos!.quantityReserved,
          quantityChange: res.quantity,
          quantityAfter: pos!.quantityReserved + res.quantity,
          performedById: userId,
          reasonCategory: 'order_reservation',
        },
      });
    }

    return this.mapOrder(order);
  }

  async updateStatus(id: string, newStatus: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');

    const currentIdx = STATUS_ORDER.indexOf(order.status);
    const newIdx = STATUS_ORDER.indexOf(newStatus);

    if (newIdx < 0) throw new BadRequestException(`Invalid status: ${newStatus}`);
    if (newIdx !== currentIdx + 1) {
      throw new BadRequestException(`Cannot transition from "${order.status}" to "${newStatus}". Next valid status: "${STATUS_ORDER[currentIdx + 1] ?? 'none'}"`);
    }

    const updateData: any = { status: newStatus };

    // On dispatch: deduct from onHand and release reservation
    if (newStatus === 'dispatched') {
      updateData.dispatchedAt = new Date();
      if (order.slaDeadlineAt && new Date() > order.slaDeadlineAt) {
        updateData.slaBreached = true;
      }

      for (const line of order.lines) {
        if (line.inventoryPositionId) {
          const pos = await this.prisma.inventoryPosition.findUnique({ where: { id: line.inventoryPositionId } });
          if (pos) {
            await this.prisma.inventoryPosition.update({
              where: { id: line.inventoryPositionId },
              data: {
                quantityOnHand: { decrement: line.quantity },
                quantityReserved: { decrement: line.quantity },
              },
            });

            await this.prisma.inventoryMovement.create({
              data: {
                movementType: 'pick',
                referenceType: 'Order',
                referenceId: order.orderRef,
                quantityBefore: pos.quantityOnHand,
                quantityChange: -line.quantity,
                quantityAfter: pos.quantityOnHand - line.quantity,
                performedById: userId,
                reasonCategory: 'order_fulfillment',
              },
            });
          }
        }
      }
    }

    if (newStatus === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: this.orderInclude,
    });

    return this.mapOrder(updated);
  }

  async cancel(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const nonCancellable = ['dispatched', 'delivered'];
    if (nonCancellable.includes(order.status)) {
      throw new BadRequestException(`Cannot cancel order in "${order.status}" status`);
    }

    // Release reservations
    for (const line of order.lines) {
      if (line.inventoryPositionId) {
        const pos = await this.prisma.inventoryPosition.findUnique({ where: { id: line.inventoryPositionId } });
        if (pos) {
          await this.prisma.inventoryPosition.update({
            where: { id: line.inventoryPositionId },
            data: { quantityReserved: { decrement: line.quantity } },
          });

          await this.prisma.inventoryMovement.create({
            data: {
              movementType: 'unreserve',
              referenceType: 'Order',
              referenceId: order.orderRef,
              quantityBefore: pos.quantityReserved,
              quantityChange: -line.quantity,
              quantityAfter: pos.quantityReserved - line.quantity,
              performedById: userId,
              reasonCategory: 'order_cancelled',
            },
          });
        }
      }
    }

    await this.prisma.order.delete({ where: { id } });
    return { ok: true };
  }

  async findAll(q?: string, clientId?: string, customerId?: string) {
    const query = q?.trim();
    const whereConditions: any[] = [];

    if (query) {
      whereConditions.push({
        OR: [
          { orderRef: { contains: query, mode: 'insensitive' } },
          { internalRef: { contains: query, mode: 'insensitive' } },
          { client: { name: { contains: query, mode: 'insensitive' } } },
          { customer: { name: { contains: query, mode: 'insensitive' } } },
          { warehouse: { code: { contains: query, mode: 'insensitive' } } },
          { status: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    if (clientId) whereConditions.push({ clientId });
    if (customerId) whereConditions.push({ customerId });

    const orders = await this.prisma.order.findMany({
      where: whereConditions.length > 0 ? { AND: whereConditions } : undefined,
      include: this.orderInclude,
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => this.mapOrder(o));
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude,
    });
    if (!order) return null;
    return this.mapOrder(order);
  }
}
