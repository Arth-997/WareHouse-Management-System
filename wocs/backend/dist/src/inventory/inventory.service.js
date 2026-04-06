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
            sku: item.sku.skuCode,
            description: item.sku.description,
            client: item.client.name,
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
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map