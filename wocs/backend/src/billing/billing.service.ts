import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(q?: string) {
    const query = q?.trim();

    // Group orders by client + billingCategory
    const clients = await this.prisma.client.findMany({
      where: query
        ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
          ],
        }
        : undefined,
      include: {
        orders: {
          select: {
            billingCategory: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return clients.map((client) => {
      const categoryCounts: Record<string, number> = {};
      for (const o of client.orders) {
        categoryCounts[o.billingCategory] = (categoryCounts[o.billingCategory] || 0) + 1;
      }

      return {
        id: client.id,
        code: client.code,
        name: client.name,
        contactEmail: client.contactEmail,
        billingCycleDay: client.billingCycleDay,
        totalOrders: client.orders.length,
        deliveredOrders: client.orders.filter((o) => o.status === 'delivered').length,
        activeOrders: client.orders.filter((o) => o.status !== 'delivered').length,
        categories: categoryCounts,
      };
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        orders: {
          include: { warehouse: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) return null;

    return {
      id: client.id,
      code: client.code,
      name: client.name,
      contactEmail: client.contactEmail,
      billingCycleDay: client.billingCycleDay,
      orders: client.orders.map((o) => ({
        orderRef: o.orderRef,
        warehouse: o.warehouse.code,
        status: o.status,
        billingCategory: o.billingCategory,
        createdAt: o.createdAt.toISOString(),
      })),
    };
  }
}
