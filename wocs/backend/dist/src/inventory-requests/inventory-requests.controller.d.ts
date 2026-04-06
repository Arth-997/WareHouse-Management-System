import { InventoryRequestsService } from './inventory-requests.service';
export declare class InventoryRequestsController {
    private readonly service;
    constructor(service: InventoryRequestsService);
    create(body: any, req: any): Promise<{
        client: {
            name: string;
            code: string;
        };
        warehouse: {
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
        clientId: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        skuId: string;
        status: string;
        respondedAt: Date | null;
        receivedAt: Date | null;
        requestedQty: number;
        notes: string | null;
        requestedById: string;
        respondedById: string | null;
    }>;
    findAll(req: any): Promise<({
        client: {
            name: string;
            code: string;
        };
        warehouse: {
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
        clientId: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        skuId: string;
        status: string;
        respondedAt: Date | null;
        receivedAt: Date | null;
        requestedQty: number;
        notes: string | null;
        requestedById: string;
        respondedById: string | null;
    })[]>;
    approve(id: string, req: any): Promise<{
        client: {
            name: string;
            code: string;
        };
        warehouse: {
            name: string;
            code: string;
        };
        sku: {
            skuCode: string;
            description: string;
        };
    } & {
        id: string;
        clientId: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        skuId: string;
        status: string;
        respondedAt: Date | null;
        receivedAt: Date | null;
        requestedQty: number;
        notes: string | null;
        requestedById: string;
        respondedById: string | null;
    }>;
    reject(id: string, req: any): Promise<{
        client: {
            name: string;
            code: string;
        };
        warehouse: {
            name: string;
            code: string;
        };
        sku: {
            skuCode: string;
            description: string;
        };
    } & {
        id: string;
        clientId: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        skuId: string;
        status: string;
        respondedAt: Date | null;
        receivedAt: Date | null;
        requestedQty: number;
        notes: string | null;
        requestedById: string;
        respondedById: string | null;
    }>;
    confirmReceived(id: string, req: any): Promise<{
        client: {
            name: string;
            code: string;
        };
        warehouse: {
            name: string;
            code: string;
        };
        sku: {
            skuCode: string;
            description: string;
        };
    } & {
        id: string;
        clientId: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        skuId: string;
        status: string;
        respondedAt: Date | null;
        receivedAt: Date | null;
        requestedQty: number;
        notes: string | null;
        requestedById: string;
        respondedById: string | null;
    }>;
}
