import { BillingService } from './billing.service';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
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
