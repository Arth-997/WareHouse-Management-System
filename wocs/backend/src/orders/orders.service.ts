import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) { }

  private mapOrder(order: any) {
    return {
      id: order.id,
      orderRef: order.orderRef,
      internalRef: order.internalRef ?? undefined,
      warehouse: order.warehouse.code,
      client: order.client.name,
      status: order.status,
      priority: order.priority,
      shippingMethod: order.shippingMethod,
      billingCategory: order.billingCategory,
      createdAt: order.createdAt.toISOString(),
      slaStartAt: order.slaStartAt ? order.slaStartAt.toISOString() : null,
      slaDeadlineAt: order.slaDeadlineAt ? order.slaDeadlineAt.toISOString() : null,
      slaBreached: order.slaBreached,
      slaWarningLeadHours: order.warehouse.slaWarningLeadHours,
    };
  }

  async findAll(q?: string, clientId?: string) {
    const query = q?.trim();

    const whereConditions: any[] = [];

    if (query) {
      whereConditions.push({
        OR: [
          { orderRef: { contains: query, mode: 'insensitive' } },
          { internalRef: { contains: query, mode: 'insensitive' } },
          { client: { name: { contains: query, mode: 'insensitive' } } },
          { warehouse: { code: { contains: query, mode: 'insensitive' } } },
          { status: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    if (clientId) {
      whereConditions.push({ clientId });
    }

    const orders = await this.prisma.order.findMany({
      where: whereConditions.length > 0 ? { AND: whereConditions } : undefined,
      include: { warehouse: true, client: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => this.mapOrder(o));
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { warehouse: true, client: true },
    });

    if (!order) return null;
    return this.mapOrder(order);
  }
}
