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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapInventoryItem(item) {
        const available = item.quantityOnHand - item.quantityReserved;
        return {
            id: item.id,
            skuId: item.skuId,
            sku: item.sku.skuCode,
            description: item.sku.description,
            clientId: item.clientId,
            client: item.client.name,
            warehouseId: item.warehouseId,
            warehouse: item.warehouse.code,
            onHand: item.quantityOnHand,
            reserved: item.quantityReserved,
            available,
            storageType: item.sku.storageType,
            expiry: item.expiryDate ? item.expiryDate.toISOString().slice(0, 10) : 'N/A',
        };
    }
    async findAll(q, clientId) {
        const query = q?.trim();
        const whereConditions = [];
        if (query) {
            whereConditions.push({
                OR: [
                    { sku: { skuCode: { contains: query, mode: 'insensitive' } } },
                    { sku: { description: { contains: query, mode: 'insensitive' } } },
                    { client: { name: { contains: query, mode: 'insensitive' } } },
                    { warehouse: { code: { contains: query, mode: 'insensitive' } } },
                ],
            });
        }
        if (clientId) {
            whereConditions.push({ clientId });
        }
        const items = await this.prisma.inventoryPosition.findMany({
            where: whereConditions.length > 0 ? { AND: whereConditions } : undefined,
            include: {
                sku: true,
                client: true,
                warehouse: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return items.map((i) => this.mapInventoryItem(i));
    }
    async findOne(id) {
        const item = await this.prisma.inventoryPosition.findUnique({
            where: { id },
            include: {
                sku: true,
                client: true,
                warehouse: true,
            },
        });
        if (!item)
            return null;
        return this.mapInventoryItem(item);
    }
    async findSkus(clientId) {
        const skus = await this.prisma.sKU.findMany({
            where: clientId ? { clientId } : undefined,
            include: { client: { select: { name: true } } },
            orderBy: { skuCode: 'asc' },
        });
        return skus.map((s) => ({
            id: s.id,
            skuCode: s.skuCode,
            description: s.description,
            client: s.client.name,
        }));
    }
    async receiveStock(data) {
        if (!data.warehouseId || !data.clientId || !data.skuId || !data.quantity) {
            throw new common_1.BadRequestException('warehouseId, clientId, skuId, and quantity are required');
        }
        const existing = await this.prisma.inventoryPosition.findFirst({
            where: {
                warehouseId: data.warehouseId,
                clientId: data.clientId,
                skuId: data.skuId,
                locationId: data.locationId ?? null,
                batchNumber: data.batchNumber ?? null,
            },
        });
        let quantityBefore = 0;
        if (existing) {
            quantityBefore = existing.quantityOnHand;
            await this.prisma.inventoryPosition.update({
                where: { id: existing.id },
                data: { quantityOnHand: { increment: data.quantity } },
            });
        }
        else {
            await this.prisma.inventoryPosition.create({
                data: {
                    warehouseId: data.warehouseId,
                    clientId: data.clientId,
                    skuId: data.skuId,
                    quantityOnHand: data.quantity,
                    locationId: data.locationId,
                    batchNumber: data.batchNumber,
                    expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
                },
            });
        }
        await this.prisma.inventoryMovement.create({
            data: {
                movementType: 'receive',
                referenceType: 'Adjustment',
                quantityBefore,
                quantityChange: data.quantity,
                quantityAfter: quantityBefore + data.quantity,
                performedById: data.performedById,
                reasonCategory: 'stock_receive',
            },
        });
        return { ok: true, quantityBefore, quantityAfter: quantityBefore + data.quantity };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map