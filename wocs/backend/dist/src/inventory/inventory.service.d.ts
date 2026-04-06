import { PrismaService } from '../prisma/prisma.service';
export declare class InventoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mapInventoryItem;
    findAll(q?: string, clientId?: string): Promise<{
        id: any;
        sku: any;
        description: any;
        client: any;
        warehouse: any;
        onHand: any;
        reserved: any;
        available: number;
        storageType: any;
        expiry: any;
    }[]>;
    findOne(id: string): Promise<{
        id: any;
        sku: any;
        description: any;
        client: any;
        warehouse: any;
        onHand: any;
        reserved: any;
        available: number;
        storageType: any;
        expiry: any;
    } | null>;
}
