import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
