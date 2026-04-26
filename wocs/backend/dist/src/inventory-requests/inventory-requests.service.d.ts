import { PrismaService } from '../prisma/prisma.service';
export declare class InventoryRequestsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: {
        warehouseId: string;
        clientId: string;
        skuId: string;
        requestedQty: number;
        notes?: string;
        requestedById: string;
    }): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        client: {
            name: string;
            code: string;
        };
        sku: {
            skuCode: string;
            description: string;
        };
        requestedBy: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        warehouseId: string;
        skuId: string;
        status: string;
        requestedQty: number;
        notes: string | null;
        respondedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        respondedById: string | null;
    }>;
    findAll(user: {
        role: string;
        clientId?: string;
        id: string;
    }): Promise<({
        warehouse: {
            name: string;
            code: string;
        };
        client: {
            name: string;
            code: string;
        };
        sku: {
            skuCode: string;
            description: string;
        };
        requestedBy: {
            name: string;
        };
        respondedBy: {
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        warehouseId: string;
        skuId: string;
        status: string;
        requestedQty: number;
        notes: string | null;
        respondedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        respondedById: string | null;
    })[]>;
    approve(requestId: string, user: {
        id: string;
        clientId?: string;
        role: string;
    }): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        client: {
            name: string;
            code: string;
        };
        sku: {
            skuCode: string;
            description: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        warehouseId: string;
        skuId: string;
        status: string;
        requestedQty: number;
        notes: string | null;
        respondedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        respondedById: string | null;
    }>;
    reject(requestId: string, user: {
        id: string;
        clientId?: string;
        role: string;
    }): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        client: {
            name: string;
            code: string;
        };
        sku: {
            skuCode: string;
            description: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        warehouseId: string;
        skuId: string;
        status: string;
        requestedQty: number;
        notes: string | null;
        respondedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        respondedById: string | null;
    }>;
    confirmReceived(requestId: string, user: {
        id: string;
        role: string;
    }): Promise<{
        warehouse: {
            name: string;
            code: string;
        };
        client: {
            name: string;
            code: string;
        };
        sku: {
            skuCode: string;
            description: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        warehouseId: string;
        skuId: string;
        status: string;
        requestedQty: number;
        notes: string | null;
        respondedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        respondedById: string | null;
    }>;
}
