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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
        const totalSkus = new Set(inventoryPositions.map((p) => p.sku.skuCode)).size;
        const activeOrders = orders.filter((o) => o.status !== 'delivered').length;
        const now = Date.now();
        let slaBreaches = 0;
        let slaWarnings = 0;
        for (const o of orders) {
            if (o.status === 'delivered')
                continue;
            if (!o.slaDeadlineAt)
                continue;
            const timeLeftMs = new Date(o.slaDeadlineAt).getTime() - now;
            if (o.slaBreached || timeLeftMs <= 0) {
                slaBreaches++;
            }
            else if (timeLeftMs <= (o.warehouse.slaWarningLeadHours ?? 0) * 3600_000) {
                slaWarnings++;
            }
        }
        const recentOrders = orders.slice(0, 5).map((o) => ({
            orderRef: o.orderRef,
            client: o.client.name,
            warehouse: o.warehouse.code,
            status: o.status,
            createdAt: o.createdAt.toISOString(),
        }));
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map