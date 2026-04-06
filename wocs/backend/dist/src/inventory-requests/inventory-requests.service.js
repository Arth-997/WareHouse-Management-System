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
exports.InventoryRequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryRequestsService = class InventoryRequestsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        if (!data.warehouseId || !data.clientId || !data.skuId || !data.requestedQty) {
            throw new common_1.BadRequestException('warehouseId, clientId, skuId, and requestedQty are required');
        }
        return this.prisma.inventoryRequest.create({
            data: {
                warehouseId: data.warehouseId,
                clientId: data.clientId,
                skuId: data.skuId,
                requestedQty: data.requestedQty,
                notes: data.notes,
                requestedById: data.requestedById,
            },
            include: {
                warehouse: { select: { code: true, name: true } },
                client: { select: { code: true, name: true } },
                sku: { select: { skuCode: true, description: true } },
                requestedBy: { select: { name: true } },
            },
        });
    }
    async findAll(user) {
        const where = {};
        if (user.role === 'CLIENT_USER') {
            if (!user.clientId)
                return [];
            where.clientId = user.clientId;
        }
        return this.prisma.inventoryRequest.findMany({
            where,
            include: {
                warehouse: { select: { code: true, name: true } },
                client: { select: { code: true, name: true } },
                sku: { select: { skuCode: true, description: true } },
                requestedBy: { select: { name: true } },
                respondedBy: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async approve(requestId, user) {
        const req = await this.prisma.inventoryRequest.findUnique({ where: { id: requestId } });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        if (req.status !== 'pending')
            throw new common_1.BadRequestException('Only pending requests can be approved');
        if (user.role === 'CLIENT_USER' && req.clientId !== user.clientId) {
            throw new common_1.ForbiddenException('You can only approve requests for your own client');
        }
        return this.prisma.inventoryRequest.update({
            where: { id: requestId },
            data: {
                status: 'approved',
                respondedById: user.id,
                respondedAt: new Date(),
            },
            include: {
                warehouse: { select: { code: true, name: true } },
                client: { select: { code: true, name: true } },
                sku: { select: { skuCode: true, description: true } },
            },
        });
    }
    async reject(requestId, user) {
        const req = await this.prisma.inventoryRequest.findUnique({ where: { id: requestId } });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        if (req.status !== 'pending')
            throw new common_1.BadRequestException('Only pending requests can be rejected');
        if (user.role === 'CLIENT_USER' && req.clientId !== user.clientId) {
            throw new common_1.ForbiddenException('You can only reject requests for your own client');
        }
        return this.prisma.inventoryRequest.update({
            where: { id: requestId },
            data: {
                status: 'rejected',
                respondedById: user.id,
                respondedAt: new Date(),
            },
            include: {
                warehouse: { select: { code: true, name: true } },
                client: { select: { code: true, name: true } },
                sku: { select: { skuCode: true, description: true } },
            },
        });
    }
    async confirmReceived(requestId, user) {
        const req = await this.prisma.inventoryRequest.findUnique({ where: { id: requestId } });
        if (!req)
            throw new common_1.NotFoundException('Request not found');
        if (req.status !== 'approved')
            throw new common_1.BadRequestException('Only approved requests can be marked as received');
        const existing = await this.prisma.inventoryPosition.findFirst({
            where: {
                warehouseId: req.warehouseId,
                clientId: req.clientId,
                skuId: req.skuId,
            },
        });
        if (existing) {
            await this.prisma.inventoryPosition.update({
                where: { id: existing.id },
                data: {
                    quantityOnHand: { increment: req.requestedQty },
                },
            });
        }
        else {
            await this.prisma.inventoryPosition.create({
                data: {
                    warehouseId: req.warehouseId,
                    clientId: req.clientId,
                    skuId: req.skuId,
                    quantityOnHand: req.requestedQty,
                },
            });
        }
        await this.prisma.inventoryMovement.create({
            data: {
                movementType: 'receive',
                referenceType: 'InventoryRequest',
                referenceId: req.id,
                quantityBefore: existing?.quantityOnHand ?? 0,
                quantityChange: req.requestedQty,
                quantityAfter: (existing?.quantityOnHand ?? 0) + req.requestedQty,
                performedById: user.id,
                reasonCategory: 'client_supply',
            },
        });
        return this.prisma.inventoryRequest.update({
            where: { id: requestId },
            data: {
                status: 'received',
                receivedAt: new Date(),
            },
            include: {
                warehouse: { select: { code: true, name: true } },
                client: { select: { code: true, name: true } },
                sku: { select: { skuCode: true, description: true } },
            },
        });
    }
};
exports.InventoryRequestsService = InventoryRequestsService;
exports.InventoryRequestsService = InventoryRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryRequestsService);
//# sourceMappingURL=inventory-requests.service.js.map