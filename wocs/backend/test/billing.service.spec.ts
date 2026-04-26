import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from '../src/billing/billing.service';
import { PrismaService } from '../src/prisma/prisma.service';

const mockClients = [
    {
        id: 'cl-1',
        code: 'TB',
        name: 'TechBrand',
        contactEmail: 'billing@techbrand.com',
        billingCycleDay: 15,
        orders: [
            { billingCategory: 'storage_handling', status: 'delivered', createdAt: new Date() },
            { billingCategory: 'storage_handling', status: 'received', createdAt: new Date() },
            { billingCategory: 'express_fulfillment', status: 'delivered', createdAt: new Date() },
            { billingCategory: 'cold_storage', status: 'picked', createdAt: new Date() },
        ],
    },
    {
        id: 'cl-2',
        code: 'FB',
        name: 'FashionBrand',
        contactEmail: 'billing@fashion.com',
        billingCycleDay: 1,
        orders: [],
    },
];

const mockClientDetail = {
    id: 'cl-1',
    code: 'TB',
    name: 'TechBrand',
    contactEmail: 'billing@techbrand.com',
    billingCycleDay: 15,
    orders: [
        { orderRef: 'ORD-001', warehouse: { code: 'WH-BL-01' }, status: 'delivered', billingCategory: 'storage_handling', createdAt: new Date() },
        { orderRef: 'ORD-002', warehouse: { code: 'WH-DL-01' }, status: 'received', billingCategory: 'express_fulfillment', createdAt: new Date() },
    ],
};

function createMockPrisma() {
    return {
        client: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
    };
}

describe('BillingService', () => {
    let service: BillingService;
    let prisma: ReturnType<typeof createMockPrisma>;

    beforeEach(async () => {
        prisma = createMockPrisma();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BillingService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();
        service = module.get<BillingService>(BillingService);
    });

    // ═══════════════════════════════════════════════════════════════
    //  findAll() — Billing aggregation by client
    // ═══════════════════════════════════════════════════════════════

    describe('findAll()', () => {
        it('should aggregate order counts per client', async () => {
            prisma.client.findMany.mockResolvedValue(mockClients);

            const result = await service.findAll();

            expect(result).toHaveLength(2);
            // TechBrand
            expect(result[0].totalOrders).toBe(4);
            expect(result[0].deliveredOrders).toBe(2);
            expect(result[0].activeOrders).toBe(2);
        });

        it('should count orders by billing category', async () => {
            prisma.client.findMany.mockResolvedValue(mockClients);

            const result = await service.findAll();

            expect(result[0].categories).toEqual({
                storage_handling: 2,
                express_fulfillment: 1,
                cold_storage: 1,
            });
        });

        it('should return zero counts for clients with no orders', async () => {
            prisma.client.findMany.mockResolvedValue(mockClients);

            const result = await service.findAll();

            expect(result[1].totalOrders).toBe(0);
            expect(result[1].deliveredOrders).toBe(0);
            expect(result[1].activeOrders).toBe(0);
        });

        it('should pass search query to Prisma filter', async () => {
            prisma.client.findMany.mockResolvedValue([]);

            await service.findAll('Tech');

            expect(prisma.client.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        OR: [
                            { name: { contains: 'Tech', mode: 'insensitive' } },
                            { code: { contains: 'Tech', mode: 'insensitive' } },
                        ],
                    },
                }),
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  findOne() — Detailed billing for a single client
    // ═══════════════════════════════════════════════════════════════

    describe('findOne()', () => {
        it('should return detailed client billing with order list', async () => {
            prisma.client.findUnique.mockResolvedValue(mockClientDetail);

            const result = await service.findOne('cl-1');

            expect(result?.code).toBe('TB');
            expect(result?.orders).toHaveLength(2);
            expect(result?.orders[0].orderRef).toBe('ORD-001');
            expect(result?.orders[0].warehouse).toBe('WH-BL-01');
        });

        it('should return null for non-existent client', async () => {
            prisma.client.findUnique.mockResolvedValue(null);
            const result = await service.findOne('bad');
            expect(result).toBeNull();
        });
    });
});
