import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(): Promise<{
        totalSkus: number;
        activeOrders: number;
        slaBreaches: number;
        slaWarnings: number;
        recentOrders: {
            orderRef: string;
            client: string;
            warehouse: string;
            status: string;
            createdAt: string;
        }[];
        warehouses: {
            id: string;
            code: string;
            name: string;
            location: string;
            isActive: boolean;
            capacityPct: number;
            orderCount: number;
        }[];
    }>;
}
