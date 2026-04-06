import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    findAll(q: string | undefined, req: any): Promise<{
        id: any;
        orderRef: any;
        internalRef: any;
        warehouse: any;
        client: any;
        status: any;
        priority: any;
        shippingMethod: any;
        billingCategory: any;
        createdAt: any;
        slaStartAt: any;
        slaDeadlineAt: any;
        slaBreached: any;
        slaWarningLeadHours: any;
    }[]>;
    findOne(id: string): Promise<{
        id: any;
        orderRef: any;
        internalRef: any;
        warehouse: any;
        client: any;
        status: any;
        priority: any;
        shippingMethod: any;
        billingCategory: any;
        createdAt: any;
        slaStartAt: any;
        slaDeadlineAt: any;
        slaBreached: any;
        slaWarningLeadHours: any;
    } | null>;
}
