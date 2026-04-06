import { WarehousesService } from './warehouses.service';
export declare class WarehousesController {
    private readonly warehousesService;
    constructor(warehousesService: WarehousesService);
    findAll(q?: string): Promise<{
        id: string;
        code: string;
        name: string;
        type: string;
        address: string;
        isActive: boolean;
        totalOnHand: number;
        totalReserved: number;
        totalAvailable: number;
        skuCount: number;
        orderCount: number;
        capacityPct: number;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        code: string;
        name: string;
        type: string;
        address: string;
        isActive: boolean;
        totalOnHand: number;
        totalReserved: number;
        totalAvailable: number;
        skuCount: number;
        capacityPct: number;
        inventory: {
            skuCode: string;
            description: string;
            client: string;
            onHand: number;
            reserved: number;
        }[];
        recentOrders: {
            orderRef: string;
            client: string;
            status: string;
            createdAt: string;
        }[];
    } | null>;
}
