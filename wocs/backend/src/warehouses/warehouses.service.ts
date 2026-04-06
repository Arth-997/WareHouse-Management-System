import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarehousesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(q?: string) {
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

    async findOne(id: string) {
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

        if (!wh) return null;

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
}
