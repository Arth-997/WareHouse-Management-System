import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    findAll(q: string | undefined, req: any): Promise<{
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
    findSkus(clientId?: string): Promise<{
        id: string;
        skuCode: string;
        description: string;
        client: string;
    }[]>;
    receiveStock(body: any, req: any): Promise<{
        ok: boolean;
        quantityBefore: number;
        quantityAfter: number;
    }>;
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
}
