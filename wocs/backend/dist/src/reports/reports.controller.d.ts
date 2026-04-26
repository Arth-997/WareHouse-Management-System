import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getAnalytics(): Promise<{
        totalOrders: number;
        ordersByStatus: Record<string, number>;
        ordersByClient: Record<string, number>;
        ordersByWarehouse: Record<string, number>;
        ordersByCustomer: Record<string, number>;
        fulfillmentRate: number;
        avgFulfillmentTimeHours: number;
        slaBreachRate: number;
        inventorySummary: {
            code: string;
            name: string;
            totalOnHand: number;
            totalReserved: number;
            totalAvailable: number;
            skuCount: number;
        }[];
        topMovingSkus: {
            skuCode: string;
            description: string;
            client: string;
            totalOrdered: number;
        }[];
    }>;
}
