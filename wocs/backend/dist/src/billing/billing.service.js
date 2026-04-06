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
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BillingService = class BillingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(q) {
        const query = q?.trim();
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
            const categoryCounts = {};
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
    async findOne(id) {
        const client = await this.prisma.client.findUnique({
            where: { id },
            include: {
                orders: {
                    include: { warehouse: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!client)
            return null;
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
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BillingService);
//# sourceMappingURL=billing.service.js.map