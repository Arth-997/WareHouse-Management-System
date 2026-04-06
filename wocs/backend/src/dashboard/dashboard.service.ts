import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async getStats() {
        const [inventoryPositions, orders, warehouses] = await Promise.all([
            this.prisma.inventoryPosition.findMany({
                include: { sku: true, warehouse: true },
            }),
            this.prisma.order.findMany({
                include: { warehouse: true, client: true },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.warehouse.findMany({
                include: {
                    inventoryPositions: {
                        select: { quantityOnHand: true },
                    },
                    _count: { select: { orders: true } },
                },
            }),
        ]);

        // KPI: unique SKU codes
        const totalSkus = new Set(inventoryPositions.map((p) => p.sku.skuCode)).size;

        // KPI: active orders (not delivered)
        const activeOrders = orders.filter((o) => o.status !== 'delivered').length;

        // SLA analysis
        const now = Date.now();
        let slaBreaches = 0;
        let slaWarnings = 0;

        for (const o of orders) {
            if (o.status === 'delivered') continue;
            if (!o.slaDeadlineAt) continue;

            const timeLeftMs = new Date(o.slaDeadlineAt).getTime() - now;
            if (o.slaBreached || timeLeftMs <= 0) {
                slaBreaches++;
            } else if (timeLeftMs <= (o.warehouse.slaWarningLeadHours ?? 0) * 3600_000) {
                slaWarnings++;
            }
        }

        // Recent orders (top 5)
        const recentOrders = orders.slice(0, 5).map((o) => ({
            orderRef: o.orderRef,
            client: o.client.name,
            warehouse: o.warehouse.code,
            status: o.status,
            createdAt: o.createdAt.toISOString(),
        }));

        // Warehouse statuses
        const warehouseStats = warehouses.map((wh) => {
            const totalOnHand = wh.inventoryPositions.reduce((s, p) => s + p.quantityOnHand, 0);
            return {
                id: wh.id,
                code: wh.code,
                name: wh.name,
                location: wh.address.split(',').pop()?.trim() || wh.address,
                isActive: wh.isActive,
                capacityPct: totalOnHand > 0 ? Math.min(100, Math.round((totalOnHand / (totalOnHand + 200)) * 100)) : 0,
                orderCount: wh._count.orders,
            };
        });

        return {
            totalSkus,
            activeOrders,
            slaBreaches,
            slaWarnings,
            recentOrders,
            warehouses: warehouseStats,
        };
    }
}
