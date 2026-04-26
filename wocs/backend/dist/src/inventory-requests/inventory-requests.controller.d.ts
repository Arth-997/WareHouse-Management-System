import { InventoryRequestsService } from './inventory-requests.service';
export declare class InventoryRequestsController {
    private readonly service;
    constructor(service: InventoryRequestsService);
    create(body: any, req: any): Promise<{
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
    findAll(req: any): Promise<({
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
    approve(id: string, req: any): Promise<{
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
    reject(id: string, req: any): Promise<{
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
    confirmReceived(id: string, req: any): Promise<{
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
