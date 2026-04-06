import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    findAll(q: string | undefined, req: any): Promise<{
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
