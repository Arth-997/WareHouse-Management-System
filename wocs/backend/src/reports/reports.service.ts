import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    async getAnalytics() {
        const [orders, inventoryPositions, warehouses, orderLines] = await Promise.all([
            this.prisma.order.findMany({
                include: { warehouse: true, client: true, customer: true },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.inventoryPosition.findMany({
                include: { sku: true, warehouse: true, client: true },
            }),
            this.prisma.warehouse.findMany({ where: { isActive: true } }),
            this.prisma.orderLine.findMany({
                include: { sku: true, order: true },
            }),
        ]);

        // Orders by status
        const ordersByStatus: Record<string, number> = {};
        for (const o of orders) {
            ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
        }

        // Orders by client (brand)
        const ordersByClient: Record<string, number> = {};
        for (const o of orders) {
            ordersByClient[o.client.name] = (ordersByClient[o.client.name] || 0) + 1;
        }

        // Orders by warehouse
        const ordersByWarehouse: Record<string, number> = {};
        for (const o of orders) {
            ordersByWarehouse[o.warehouse.code] = (ordersByWarehouse[o.warehouse.code] || 0) + 1;
        }

        // Fulfillment rate
        const delivered = orders.filter((o) => o.status === 'delivered').length;
        const fulfillmentRate = orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 0;

        // Avg fulfillment time (for delivered orders, from creation to delivery)
        const deliveredOrders = orders.filter((o) => o.status === 'delivered' && o.deliveredAt);
        let avgFulfillmentTimeHours = 0;
        if (deliveredOrders.length) {
            const totalHours = deliveredOrders.reduce((sum, o) => {
                return sum + (new Date(o.deliveredAt!).getTime() - new Date(o.createdAt).getTime()) / 3600_000;
            }, 0);
            avgFulfillmentTimeHours = Math.round(totalHours / deliveredOrders.length * 10) / 10;
        }

        // SLA breach rate (among non-delivered)
        const activeOrders = orders.filter((o) => o.status !== 'delivered');
        const breached = activeOrders.filter((o) => o.slaBreached).length;
        const slaBreachRate = activeOrders.length > 0 ? Math.round((breached / activeOrders.length) * 100) : 0;

        // Inventory by warehouse
        const whMap = new Map<string, { code: string; name: string; totalOnHand: number; totalReserved: number; totalAvailable: number; skuCount: number }>();
        for (const wh of warehouses) {
            whMap.set(wh.id, { code: wh.code, name: wh.name, totalOnHand: 0, totalReserved: 0, totalAvailable: 0, skuCount: 0 });
        }
        for (const pos of inventoryPositions) {
            const entry = whMap.get(pos.warehouseId);
            if (entry) {
                entry.totalOnHand += pos.quantityOnHand;
                entry.totalReserved += pos.quantityReserved;
                entry.totalAvailable += pos.quantityOnHand - pos.quantityReserved;
                entry.skuCount++;
            }
        }
        const inventorySummary = Array.from(whMap.values());

        // Top moving SKUs (by total ordered quantity)
        const skuQtyMap = new Map<string, { skuCode: string; description: string; client: string; totalOrdered: number }>();
        for (const line of orderLines) {
            const key = line.skuId;
            const existing = skuQtyMap.get(key);
            if (existing) {
                existing.totalOrdered += line.quantity;
            } else {
                skuQtyMap.set(key, {
                    skuCode: line.sku.skuCode,
                    description: line.sku.description,
                    client: '', // populated below
                    totalOrdered: line.quantity,
                });
            }
        }
        // Add client name
        const skuClientMap = new Map<string, string>();
        for (const pos of inventoryPositions) {
            if (!skuClientMap.has(pos.skuId)) {
                skuClientMap.set(pos.skuId, pos.client.name);
            }
        }
        for (const [skuId, entry] of skuQtyMap) {
            entry.client = skuClientMap.get(skuId) ?? '';
        }
        const topMovingSkus = Array.from(skuQtyMap.values())
            .sort((a, b) => b.totalOrdered - a.totalOrdered)
            .slice(0, 10);

        // Orders by customer
        const ordersByCustomer: Record<string, number> = {};
        for (const o of orders) {
            const name = o.customer?.name ?? 'Unassigned';
            ordersByCustomer[name] = (ordersByCustomer[name] || 0) + 1;
        }

        return {
            totalOrders: orders.length,
            ordersByStatus,
            ordersByClient,
            ordersByWarehouse,
            ordersByCustomer,
            fulfillmentRate,
            avgFulfillmentTimeHours,
            slaBreachRate,
            inventorySummary,
            topMovingSkus,
        };
    }
}
