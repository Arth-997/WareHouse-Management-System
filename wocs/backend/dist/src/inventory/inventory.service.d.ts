import { PrismaService } from '../prisma/prisma.service';
export declare class InventoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mapInventoryItem;
    findAll(q?: string, clientId?: string): Promise<{
        id: any;
        skuId: any;
        sku: any;
        description: any;
        clientId: any;
        client: any;
        warehouseId: any;
        warehouse: any;
        onHand: any;
        reserved: any;
        available: number;
        storageType: any;
        expiry: any;
    }[]>;
    findOne(id: string): Promise<{
        id: any;
        skuId: any;
        sku: any;
        description: any;
        clientId: any;
        client: any;
        warehouseId: any;
        warehouse: any;
        onHand: any;
        reserved: any;
        available: number;
        storageType: any;
        expiry: any;
    } | null>;
    findSkus(clientId?: string): Promise<{
        id: string;
        skuCode: string;
        description: string;
        client: string;
    }[]>;
    receiveStock(data: {
        warehouseId: string;
        clientId: string;
        skuId: string;
        quantity: number;
        performedById: string;
        batchNumber?: string;
        expiryDate?: string;
        locationId?: string;
    }): Promise<{
        ok: boolean;
        quantityBefore: number;
        quantityAfter: number;
    }>;
}
