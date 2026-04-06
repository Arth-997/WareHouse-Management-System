import { PrismaService } from '../prisma/prisma.service';
export declare class BillingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(q?: string): Promise<{
        id: string;
        code: string;
        name: string;
        contactEmail: string;
        billingCycleDay: number;
        totalOrders: number;
        deliveredOrders: number;
        activeOrders: number;
        categories: Record<string, number>;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        code: string;
        name: string;
        contactEmail: string;
        billingCycleDay: number;
        orders: {
            orderRef: string;
            warehouse: string;
            status: string;
            billingCategory: string;
            createdAt: string;
        }[];
    } | null>;
}
