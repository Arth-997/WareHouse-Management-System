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
exports.WarehousesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WarehousesService = class WarehousesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(q) {
        const query = q?.trim();
        const warehouses = await this.prisma.warehouse.findMany({
            where: query
                ? {
                    OR: [
                        { code: { contains: query, mode: 'insensitive' } },
                        { name: { contains: query, mode: 'insensitive' } },
                        { address: { contains: query, mode: 'insensitive' } },
                    ],
                }
                : undefined,
            include: {
                inventoryPositions: {
                    select: { quantityOnHand: true, quantityReserved: true },
                },
                _count: { select: { orders: true } },
            },
            orderBy: { name: 'asc' },
        });
        return warehouses.map((wh) => {
            const totalOnHand = wh.inventoryPositions.reduce((s, p) => s + p.quantityOnHand, 0);
            const totalReserved = wh.inventoryPositions.reduce((s, p) => s + p.quantityReserved, 0);
            return {
                id: wh.id,
                code: wh.code,
                name: wh.name,
                type: wh.type,
                address: wh.address,
                isActive: wh.isActive,
                totalOnHand,
                totalReserved,
                totalAvailable: totalOnHand - totalReserved,
                skuCount: wh.inventoryPositions.length,
                orderCount: wh._count.orders,
                capacityPct: totalOnHand > 0 ? Math.min(100, Math.round((totalOnHand / (totalOnHand + 200)) * 100)) : 0,
            };
        });
    }
    async findOne(id) {
        const wh = await this.prisma.warehouse.findUnique({
            where: { id },
            include: {
                inventoryPositions: {
                    include: { sku: true, client: true },
                },
                orders: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: { client: true },
                },
            },
        });
        if (!wh)
            return null;
        const totalOnHand = wh.inventoryPositions.reduce((s, p) => s + p.quantityOnHand, 0);
        const totalReserved = wh.inventoryPositions.reduce((s, p) => s + p.quantityReserved, 0);
        return {
            id: wh.id,
            code: wh.code,
            name: wh.name,
            type: wh.type,
            address: wh.address,
            isActive: wh.isActive,
            totalOnHand,
            totalReserved,
            totalAvailable: totalOnHand - totalReserved,
            skuCount: wh.inventoryPositions.length,
            capacityPct: totalOnHand > 0 ? Math.min(100, Math.round((totalOnHand / (totalOnHand + 200)) * 100)) : 0,
            inventory: wh.inventoryPositions.map((p) => ({
                skuCode: p.sku.skuCode,
                description: p.sku.description,
                client: p.client.name,
                onHand: p.quantityOnHand,
                reserved: p.quantityReserved,
            })),
            recentOrders: wh.orders.map((o) => ({
                orderRef: o.orderRef,
                client: o.client.name,
                status: o.status,
                createdAt: o.createdAt.toISOString(),
            })),
        };
    }
};
exports.WarehousesService = WarehousesService;
exports.WarehousesService = WarehousesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WarehousesService);
//# sourceMappingURL=warehouses.service.js.map