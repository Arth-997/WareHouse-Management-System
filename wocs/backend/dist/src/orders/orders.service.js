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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrdersService = class OrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapOrder(order) {
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
    async findAll(q, clientId) {
        const query = q?.trim();
        const whereConditions = [];
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
    async findOne(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { warehouse: true, client: true },
        });
        if (!order)
            return null;
        return this.mapOrder(order);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map