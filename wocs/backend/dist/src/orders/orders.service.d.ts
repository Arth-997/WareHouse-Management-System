import { PrismaService } from '../prisma/prisma.service';
export declare class OrdersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mapOrder;
    findAll(q?: string, clientId?: string): Promise<{
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
