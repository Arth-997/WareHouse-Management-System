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
const STATUS_ORDER = ['received', 'allocated', 'picked', 'packed', 'dispatched', 'delivered'];
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
            warehouseId: order.warehouseId,
            client: order.client.name,
            clientId: order.clientId,
            customer: order.customer?.name ?? null,
            customerId: order.customerId,
            status: order.status,
            priority: order.priority,
            shippingMethod: order.shippingMethod,
            billingCategory: order.billingCategory,
            deliveryAddress: order.deliveryAddress,
            createdAt: order.createdAt.toISOString(),
            slaStartAt: order.slaStartAt ? order.slaStartAt.toISOString() : null,
            slaDeadlineAt: order.slaDeadlineAt ? order.slaDeadlineAt.toISOString() : null,
            slaBreached: order.slaBreached,
            slaWarningLeadHours: order.warehouse.slaWarningLeadHours,
            lines: (order.lines ?? []).map((l) => ({
                id: l.id,
                skuId: l.skuId,
                skuCode: l.sku?.skuCode ?? '',
                description: l.sku?.description ?? '',
                quantity: l.quantity,
                inventoryPositionId: l.inventoryPositionId,
            })),
        };
    }
    async generateOrderRef() {
        const year = new Date().getFullYear();
        const lastOrder = await this.prisma.order.findFirst({
            where: { orderRef: { startsWith: `ORD-${year}-` } },
            orderBy: { orderRef: 'desc' },
        });
        const lastNum = lastOrder ? parseInt(lastOrder.orderRef.split('-').pop() || '0', 10) : 0;
        return `ORD-${year}-${String(lastNum + 1).padStart(4, '0')}`;
    }
    orderInclude = {
        warehouse: true,
        client: true,
        customer: true,
        lines: { include: { sku: true } },
    };
    async create(data, userId) {
        if (!data.warehouseId || !data.clientId) {
            throw new common_1.BadRequestException('warehouseId and clientId are required');
        }
        if (!data.lines?.length) {
            throw new common_1.BadRequestException('At least one order line is required');
        }
        const reservations = [];
        for (const line of data.lines) {
            if (line.quantity <= 0)
                throw new common_1.BadRequestException('Quantity must be > 0');
            const position = await this.prisma.inventoryPosition.findFirst({
                where: {
                    warehouseId: data.warehouseId,
                    clientId: data.clientId,
                    skuId: line.skuId,
                },
            });
            if (!position) {
                throw new common_1.BadRequestException(`No inventory found for SKU ${line.skuId} in this warehouse`);
            }
            const available = position.quantityOnHand - position.quantityReserved;
            if (available < line.quantity) {
                throw new common_1.BadRequestException(`Insufficient stock for SKU. Available: ${available}, Requested: ${line.quantity}`);
            }
            reservations.push({ positionId: position.id, quantity: line.quantity });
        }
        const orderRef = await this.generateOrderRef();
        const now = new Date();
        const slaDuration = data.slaDurationHours ?? 24;
        const slaDeadline = new Date(now.getTime() + slaDuration * 3600_000);
        const order = await this.prisma.order.create({
            data: {
                orderRef,
                warehouseId: data.warehouseId,
                clientId: data.clientId,
                customerId: data.customerId || null,
                status: 'received',
                priority: data.priority || 'normal',
                shippingMethod: data.shippingMethod || 'standard',
                billingCategory: data.billingCategory || 'storage_handling',
                deliveryAddress: data.deliveryAddress || {},
                slaStartAt: now,
                slaDeadlineAt: slaDeadline,
                lines: {
                    create: data.lines.map((l, idx) => ({
                        skuId: l.skuId,
                        quantity: l.quantity,
                        inventoryPositionId: reservations[idx].positionId,
                    })),
                },
            },
            include: this.orderInclude,
        });
        for (const res of reservations) {
            const pos = await this.prisma.inventoryPosition.findUnique({ where: { id: res.positionId } });
            await this.prisma.inventoryPosition.update({
                where: { id: res.positionId },
                data: { quantityReserved: { increment: res.quantity } },
            });
            await this.prisma.inventoryMovement.create({
                data: {
                    movementType: 'reserve',
                    referenceType: 'Order',
                    referenceId: order.orderRef,
                    quantityBefore: pos.quantityReserved,
                    quantityChange: res.quantity,
                    quantityAfter: pos.quantityReserved + res.quantity,
                    performedById: userId,
                    reasonCategory: 'order_reservation',
                },
            });
        }
        return this.mapOrder(order);
    }
    async updateStatus(id, newStatus, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: this.orderInclude,
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const currentIdx = STATUS_ORDER.indexOf(order.status);
        const newIdx = STATUS_ORDER.indexOf(newStatus);
        if (newIdx < 0)
            throw new common_1.BadRequestException(`Invalid status: ${newStatus}`);
        if (newIdx !== currentIdx + 1) {
            throw new common_1.BadRequestException(`Cannot transition from "${order.status}" to "${newStatus}". Next valid status: "${STATUS_ORDER[currentIdx + 1] ?? 'none'}"`);
        }
        const updateData = { status: newStatus };
        if (newStatus === 'dispatched') {
            updateData.dispatchedAt = new Date();
            if (order.slaDeadlineAt && new Date() > order.slaDeadlineAt) {
                updateData.slaBreached = true;
            }
            for (const line of order.lines) {
                if (line.inventoryPositionId) {
                    const pos = await this.prisma.inventoryPosition.findUnique({ where: { id: line.inventoryPositionId } });
                    if (pos) {
                        await this.prisma.inventoryPosition.update({
                            where: { id: line.inventoryPositionId },
                            data: {
                                quantityOnHand: { decrement: line.quantity },
                                quantityReserved: { decrement: line.quantity },
                            },
                        });
                        await this.prisma.inventoryMovement.create({
                            data: {
                                movementType: 'pick',
                                referenceType: 'Order',
                                referenceId: order.orderRef,
                                quantityBefore: pos.quantityOnHand,
                                quantityChange: -line.quantity,
                                quantityAfter: pos.quantityOnHand - line.quantity,
                                performedById: userId,
                                reasonCategory: 'order_fulfillment',
                            },
                        });
                    }
                }
            }
        }
        if (newStatus === 'delivered') {
            updateData.deliveredAt = new Date();
        }
        const updated = await this.prisma.order.update({
            where: { id },
            data: updateData,
            include: this.orderInclude,
        });
        return this.mapOrder(updated);
    }
    async cancel(id, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { lines: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const nonCancellable = ['dispatched', 'delivered'];
        if (nonCancellable.includes(order.status)) {
            throw new common_1.BadRequestException(`Cannot cancel order in "${order.status}" status`);
        }
        for (const line of order.lines) {
            if (line.inventoryPositionId) {
                const pos = await this.prisma.inventoryPosition.findUnique({ where: { id: line.inventoryPositionId } });
                if (pos) {
                    await this.prisma.inventoryPosition.update({
                        where: { id: line.inventoryPositionId },
                        data: { quantityReserved: { decrement: line.quantity } },
                    });
                    await this.prisma.inventoryMovement.create({
                        data: {
                            movementType: 'unreserve',
                            referenceType: 'Order',
                            referenceId: order.orderRef,
                            quantityBefore: pos.quantityReserved,
                            quantityChange: -line.quantity,
                            quantityAfter: pos.quantityReserved - line.quantity,
                            performedById: userId,
                            reasonCategory: 'order_cancelled',
                        },
                    });
                }
            }
        }
        await this.prisma.order.delete({ where: { id } });
        return { ok: true };
    }
    async findAll(q, clientId, customerId, status) {
        const query = q?.trim();
        const whereConditions = [];
        if (query) {
            whereConditions.push({
                OR: [
                    { orderRef: { contains: query, mode: 'insensitive' } },
                    { internalRef: { contains: query, mode: 'insensitive' } },
                    { client: { name: { contains: query, mode: 'insensitive' } } },
                    { customer: { name: { contains: query, mode: 'insensitive' } } },
                    { warehouse: { code: { contains: query, mode: 'insensitive' } } },
                    { status: { contains: query, mode: 'insensitive' } },
                ],
            });
        }
        if (clientId)
            whereConditions.push({ clientId });
        if (customerId)
            whereConditions.push({ customerId });
        if (status)
            whereConditions.push({ status });
        const orders = await this.prisma.order.findMany({
            where: whereConditions.length > 0 ? { AND: whereConditions } : undefined,
            include: this.orderInclude,
            orderBy: { createdAt: 'desc' },
        });
        return orders.map((o) => this.mapOrder(o));
    }
    async findOne(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: this.orderInclude,
        });
        if (!order)
            return null;
        return this.mapOrder(order);
    }
    async createRequest(data) {
        if (!data.warehouseId || !data.clientId || !data.customerId) {
            throw new common_1.BadRequestException('warehouseId, clientId, and customerId are required');
        }
        if (!data.lines?.length) {
            throw new common_1.BadRequestException('At least one line item is required');
        }
        for (const line of data.lines) {
            if (line.quantity <= 0)
                throw new common_1.BadRequestException('Quantity must be > 0');
        }
        const orderRef = await this.generateOrderRef();
        const order = await this.prisma.order.create({
            data: {
                orderRef,
                warehouseId: data.warehouseId,
                clientId: data.clientId,
                customerId: data.customerId,
                status: 'requested',
                priority: data.priority || 'normal',
                shippingMethod: data.shippingMethod || 'standard',
                billingCategory: data.billingCategory || 'storage_handling',
                deliveryAddress: data.deliveryAddress || {},
                lines: {
                    create: data.lines.map((l) => ({
                        skuId: l.skuId,
                        quantity: l.quantity,
                    })),
                },
            },
            include: this.orderInclude,
        });
        return this.mapOrder(order);
    }
    async approveRequest(id, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: this.orderInclude,
        });
        if (!order)
            throw new common_1.NotFoundException('Order request not found');
        if (order.status !== 'requested') {
            throw new common_1.BadRequestException('Only orders with status "requested" can be approved');
        }
        const reservations = [];
        for (const line of order.lines) {
            const position = await this.prisma.inventoryPosition.findFirst({
                where: {
                    warehouseId: order.warehouseId,
                    clientId: order.clientId,
                    skuId: line.skuId,
                },
            });
            if (!position) {
                const sku = line.sku?.skuCode ?? line.skuId;
                throw new common_1.BadRequestException(`No inventory found for SKU ${sku} in warehouse ${order.warehouse.code}`);
            }
            const available = position.quantityOnHand - position.quantityReserved;
            if (available < line.quantity) {
                const sku = line.sku?.skuCode ?? line.skuId;
                throw new common_1.BadRequestException(`Insufficient stock for SKU ${sku}. Available: ${available}, Requested: ${line.quantity}`);
            }
            reservations.push({ positionId: position.id, quantity: line.quantity, lineId: line.id });
        }
        for (const res of reservations) {
            const pos = await this.prisma.inventoryPosition.findUnique({ where: { id: res.positionId } });
            await this.prisma.inventoryPosition.update({
                where: { id: res.positionId },
                data: { quantityReserved: { increment: res.quantity } },
            });
            await this.prisma.orderLine.update({
                where: { id: res.lineId },
                data: { inventoryPositionId: res.positionId },
            });
            await this.prisma.inventoryMovement.create({
                data: {
                    movementType: 'reserve',
                    referenceType: 'Order',
                    referenceId: order.orderRef,
                    quantityBefore: pos.quantityReserved,
                    quantityChange: res.quantity,
                    quantityAfter: pos.quantityReserved + res.quantity,
                    performedById: userId,
                    reasonCategory: 'order_reservation',
                },
            });
        }
        const now = new Date();
        const slaDeadline = new Date(now.getTime() + 24 * 3600_000);
        const updated = await this.prisma.order.update({
            where: { id },
            data: {
                status: 'received',
                slaStartAt: now,
                slaDeadlineAt: slaDeadline,
            },
            include: this.orderInclude,
        });
        return this.mapOrder(updated);
    }
    async rejectRequest(id) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order request not found');
        if (order.status !== 'requested') {
            throw new common_1.BadRequestException('Only orders with status "requested" can be rejected');
        }
        const updated = await this.prisma.order.update({
            where: { id },
            data: { status: 'rejected' },
            include: this.orderInclude,
        });
        return this.mapOrder(updated);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map