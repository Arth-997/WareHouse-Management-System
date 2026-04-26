"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
        const ordersByStatus = {};
        for (const o of orders) {
            ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
        }
        const ordersByClient = {};
        for (const o of orders) {
            ordersByClient[o.client.name] = (ordersByClient[o.client.name] || 0) + 1;
        }
        const ordersByWarehouse = {};
        for (const o of orders) {
            ordersByWarehouse[o.warehouse.code] = (ordersByWarehouse[o.warehouse.code] || 0) + 1;
        }
        const delivered = orders.filter((o) => o.status === 'delivered').length;
        const fulfillmentRate = orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 0;
        const deliveredOrders = orders.filter((o) => o.status === 'delivered' && o.deliveredAt);
        let avgFulfillmentTimeHours = 0;
        if (deliveredOrders.length) {
            const totalHours = deliveredOrders.reduce((sum, o) => {
                return sum + (new Date(o.deliveredAt).getTime() - new Date(o.createdAt).getTime()) / 3600_000;
            }, 0);
            avgFulfillmentTimeHours = Math.round(totalHours / deliveredOrders.length * 10) / 10;
        }
        const activeOrders = orders.filter((o) => o.status !== 'delivered');
        const breached = activeOrders.filter((o) => o.slaBreached).length;
        const slaBreachRate = activeOrders.length > 0 ? Math.round((breached / activeOrders.length) * 100) : 0;
        const whMap = new Map();
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
        const skuQtyMap = new Map();
        for (const line of orderLines) {
            const key = line.skuId;
            const existing = skuQtyMap.get(key);
            if (existing) {
                existing.totalOrdered += line.quantity;
            }
            else {
                skuQtyMap.set(key, {
                    skuCode: line.sku.skuCode,
                    description: line.sku.description,
                    client: '',
                    totalOrdered: line.quantity,
                });
            }
        }
        const skuClientMap = new Map();
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
        const ordersByCustomer = {};
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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map