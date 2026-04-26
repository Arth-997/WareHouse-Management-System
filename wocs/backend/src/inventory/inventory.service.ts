import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) { }

  private mapInventoryItem(item: any) {
    const available = item.quantityOnHand - item.quantityReserved;
    return {
      id: item.id,
      skuId: item.skuId,
      sku: item.sku.skuCode,
      description: item.sku.description,
      clientId: item.clientId,
      client: item.client.name,
      warehouseId: item.warehouseId,
      warehouse: item.warehouse.code,
      onHand: item.quantityOnHand,
      reserved: item.quantityReserved,
      available,
      storageType: item.sku.storageType,
      expiry: item.expiryDate ? item.expiryDate.toISOString().slice(0, 10) : 'N/A',
    };
  }

  async findAll(q?: string, clientId?: string) {
    const query = q?.trim();

    const whereConditions: any[] = [];

    if (query) {
      whereConditions.push({
        OR: [
          { sku: { skuCode: { contains: query, mode: 'insensitive' } } },
          { sku: { description: { contains: query, mode: 'insensitive' } } },
          { client: { name: { contains: query, mode: 'insensitive' } } },
          { warehouse: { code: { contains: query, mode: 'insensitive' } } },
        ],
      });
    }

    // Data scoping for CLIENT_USER
    if (clientId) {
      whereConditions.push({ clientId });
    }

    const items = await this.prisma.inventoryPosition.findMany({
      where: whereConditions.length > 0 ? { AND: whereConditions } : undefined,
      include: {
        sku: true,
        client: true,
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((i) => this.mapInventoryItem(i));
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryPosition.findUnique({
      where: { id },
      include: {
        sku: true,
        client: true,
        warehouse: true,
      },
    });

    if (!item) return null;
    return this.mapInventoryItem(item);
  }

  async findSkus(clientId?: string) {
    const skus = await this.prisma.sKU.findMany({
      where: clientId ? { clientId } : undefined,
      include: { client: { select: { name: true } } },
      orderBy: { skuCode: 'asc' },
    });

    return skus.map((s) => ({
      id: s.id,
      skuCode: s.skuCode,
      description: s.description,
      client: s.client.name,
    }));
  }

  async receiveStock(data: {
    warehouseId: string;
    clientId: string;
    skuId: string;
    quantity: number;
    performedById: string;
    batchNumber?: string;
    expiryDate?: string;
    locationId?: string;
  }) {
    if (!data.warehouseId || !data.clientId || !data.skuId || !data.quantity) {
      throw new BadRequestException('warehouseId, clientId, skuId, and quantity are required');
    }

    const existing = await this.prisma.inventoryPosition.findFirst({
      where: {
        warehouseId: data.warehouseId,
        clientId: data.clientId,
        skuId: data.skuId,
        locationId: data.locationId ?? null,
        batchNumber: data.batchNumber ?? null,
      },
    });

    let quantityBefore = 0;

    if (existing) {
      quantityBefore = existing.quantityOnHand;
      await this.prisma.inventoryPosition.update({
        where: { id: existing.id },
        data: { quantityOnHand: { increment: data.quantity } },
      });
    } else {
      await this.prisma.inventoryPosition.create({
        data: {
          warehouseId: data.warehouseId,
          clientId: data.clientId,
          skuId: data.skuId,
          quantityOnHand: data.quantity,
          locationId: data.locationId,
          batchNumber: data.batchNumber,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        },
      });
    }

    // Audit movement
    await this.prisma.inventoryMovement.create({
      data: {
        movementType: 'receive',
        referenceType: 'Adjustment',
        quantityBefore,
        quantityChange: data.quantity,
        quantityAfter: quantityBefore + data.quantity,
        performedById: data.performedById,
        reasonCategory: 'stock_receive',
      },
    });

    return { ok: true, quantityBefore, quantityAfter: quantityBefore + data.quantity };
  }
}
