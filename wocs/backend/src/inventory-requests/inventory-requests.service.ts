import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryRequestsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a new inventory request (warehouse staff only).
     */
    async create(data: {
        warehouseId: string;
        clientId: string;
        skuId: string;
        requestedQty: number;
        notes?: string;
        requestedById: string;
    }) {
        if (!data.warehouseId || !data.clientId || !data.skuId || !data.requestedQty) {
            throw new BadRequestException('warehouseId, clientId, skuId, and requestedQty are required');
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

    /**
     * List inventory requests, filtered by role:
     * - CLIENT_USER sees only their own client's requests
     * - Warehouse staff sees all (or optionally filtered)
     */
    async findAll(user: { role: string; clientId?: string; id: string }) {
        const where: any = {};

        if (user.role === 'CLIENT_USER') {
            if (!user.clientId) return [];
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

    /**
     * Client approves a pending request.
     */
    async approve(requestId: string, user: { id: string; clientId?: string; role: string }) {
        const req = await this.prisma.inventoryRequest.findUnique({ where: { id: requestId } });
        if (!req) throw new NotFoundException('Request not found');
        if (req.status !== 'pending') throw new BadRequestException('Only pending requests can be approved');

        // CLIENT_USER can only approve their own client's requests
        if (user.role === 'CLIENT_USER' && req.clientId !== user.clientId) {
            throw new ForbiddenException('You can only approve requests for your own client');
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

    /**
     * Client rejects a pending request.
     */
    async reject(requestId: string, user: { id: string; clientId?: string; role: string }) {
        const req = await this.prisma.inventoryRequest.findUnique({ where: { id: requestId } });
        if (!req) throw new NotFoundException('Request not found');
        if (req.status !== 'pending') throw new BadRequestException('Only pending requests can be rejected');

        if (user.role === 'CLIENT_USER' && req.clientId !== user.clientId) {
            throw new ForbiddenException('You can only reject requests for your own client');
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

    /**
     * Warehouse confirms receipt of approved inventory.
     * Updates the InventoryPosition (creates one if it doesn't exist).
     */
    async confirmReceived(requestId: string, user: { id: string; role: string }) {
        const req = await this.prisma.inventoryRequest.findUnique({ where: { id: requestId } });
        if (!req) throw new NotFoundException('Request not found');
        if (req.status !== 'approved') throw new BadRequestException('Only approved requests can be marked as received');

        // Update inventory position
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
        } else {
            await this.prisma.inventoryPosition.create({
                data: {
                    warehouseId: req.warehouseId,
                    clientId: req.clientId,
                    skuId: req.skuId,
                    quantityOnHand: req.requestedQty,
                },
            });
        }

        // Log the inventory movement
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
}
