import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../src/reports/reports.service';
import { PrismaService } from '../src/prisma/prisma.service';

const now = new Date();
const HOUR_MS = 3600_000;

const mockClient = { id: 'cl-1', name: 'TechBrand' };
const mockCustomer = { id: 'cu-1', name: 'RaviElec' };
const mockWarehouse = { id: 'wh-1', code: 'WH-BL-01', name: 'Bangalore Hub', isActive: true };

const mockOrders = [
    {
        id: '1', orderRef: 'ORD-001', status: 'delivered', client: mockClient, customer: mockCustomer,
        warehouse: mockWarehouse, slaBreached: false, createdAt: new Date(now.getTime() - 48 * HOUR_MS),
        deliveredAt: new Date(now.getTime() - 24 * HOUR_MS), // 24 hours fulfillment
    },
    {
        id: '2', orderRef: 'ORD-002', status: 'received', client: mockClient, customer: null,
        warehouse: mockWarehouse, slaBreached: true, createdAt: now, deliveredAt: null,
    },
    {
        id: '3', orderRef: 'ORD-003', status: 'delivered', client: { id: 'cl-2', name: 'FashionBrand' },
        customer: mockCustomer, warehouse: { ...mockWarehouse, code: 'WH-DL-01' },
        slaBreached: false, createdAt: new Date(now.getTime() - 12 * HOUR_MS),
        deliveredAt: new Date(now.getTime() - 6 * HOUR_MS), // 6 hours fulfillment
    },
];

const mockPositions = [
    { skuId: 'sku-1', sku: { skuCode: 'SKU-A' }, warehouseId: 'wh-1', warehouse: mockWarehouse, clientId: 'cl-1', client: mockClient, quantityOnHand: 100, quantityReserved: 20 },
    { skuId: 'sku-2', sku: { skuCode: 'SKU-B' }, warehouseId: 'wh-1', warehouse: mockWarehouse, clientId: 'cl-1', client: mockClient, quantityOnHand: 50, quantityReserved: 10 },
];

const mockOrderLines = [
    { skuId: 'sku-1', sku: { skuCode: 'SKU-A', description: 'Widget A' }, order: mockOrders[0], quantity: 5 },
    { skuId: 'sku-1', sku: { skuCode: 'SKU-A', description: 'Widget A' }, order: mockOrders[1], quantity: 3 },
    { skuId: 'sku-2', sku: { skuCode: 'SKU-B', description: 'Widget B' }, order: mockOrders[2], quantity: 10 },
];

function createMockPrisma() {
    return {
        order: { findMany: jest.fn() },
        inventoryPosition: { findMany: jest.fn() },
        warehouse: { findMany: jest.fn() },
        orderLine: { findMany: jest.fn() },
    };
}

describe('ReportsService', () => {
    let service: ReportsService;
    let prisma: ReturnType<typeof createMockPrisma>;

    beforeEach(async () => {
        prisma = createMockPrisma();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReportsService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();
        service = module.get<ReportsService>(ReportsService);

        // Default mock setup
        prisma.order.findMany.mockResolvedValue(mockOrders);
        prisma.inventoryPosition.findMany.mockResolvedValue(mockPositions);
        prisma.warehouse.findMany.mockResolvedValue([mockWarehouse]);
        prisma.orderLine.findMany.mockResolvedValue(mockOrderLines);
    });

    describe('getAnalytics()', () => {
        it('should return total order count', async () => {
            const result = await service.getAnalytics();
            expect(result.totalOrders).toBe(3);
        });

        it('should aggregate orders by status', async () => {
            const result = await service.getAnalytics();
            expect(result.ordersByStatus).toEqual({ delivered: 2, received: 1 });
        });

        it('should aggregate orders by client', async () => {
            const result = await service.getAnalytics();
            expect(result.ordersByClient).toEqual({ TechBrand: 2, FashionBrand: 1 });
        });

        it('should aggregate orders by warehouse', async () => {
            const result = await service.getAnalytics();
            expect(result.ordersByWarehouse['WH-BL-01']).toBe(2);
            expect(result.ordersByWarehouse['WH-DL-01']).toBe(1);
        });

        it('should aggregate orders by customer name', async () => {
            const result = await service.getAnalytics();
            expect(result.ordersByCustomer['RaviElec']).toBe(2);
            expect(result.ordersByCustomer['Unassigned']).toBe(1);
        });

        it('should calculate fulfillment rate as percentage of delivered orders', async () => {
            const result = await service.getAnalytics();
            // 2 delivered out of 3 total = 67%
            expect(result.fulfillmentRate).toBe(67);
        });

        it('should calculate average fulfillment time in hours for delivered orders', async () => {
            const result = await service.getAnalytics();
            // Order 1: 24h, Order 3: 6h. Average = 15h
            expect(result.avgFulfillmentTimeHours).toBe(15);
        });

        it('should calculate SLA breach rate among active (non-delivered) orders', async () => {
            const result = await service.getAnalytics();
            // 1 active order (ORD-002, breached) out of 1 active → 100%
            expect(result.slaBreachRate).toBe(100);
        });

        it('should aggregate inventory by warehouse with totals', async () => {
            const result = await service.getAnalytics();
            expect(result.inventorySummary).toHaveLength(1);
            expect(result.inventorySummary[0].code).toBe('WH-BL-01');
            expect(result.inventorySummary[0].totalOnHand).toBe(150);
            expect(result.inventorySummary[0].totalReserved).toBe(30);
            expect(result.inventorySummary[0].totalAvailable).toBe(120);
            expect(result.inventorySummary[0].skuCount).toBe(2);
        });

        it('should rank top moving SKUs by total ordered quantity', async () => {
            const result = await service.getAnalytics();
            expect(result.topMovingSkus).toHaveLength(2);
            // SKU-B has 10 ordered, SKU-A has 8 (5+3)
            expect(result.topMovingSkus[0].skuCode).toBe('SKU-B');
            expect(result.topMovingSkus[0].totalOrdered).toBe(10);
            expect(result.topMovingSkus[1].skuCode).toBe('SKU-A');
            expect(result.topMovingSkus[1].totalOrdered).toBe(8);
        });

        it('should handle empty data gracefully', async () => {
            prisma.order.findMany.mockResolvedValue([]);
            prisma.inventoryPosition.findMany.mockResolvedValue([]);
            prisma.warehouse.findMany.mockResolvedValue([]);
            prisma.orderLine.findMany.mockResolvedValue([]);

            const result = await service.getAnalytics();

            expect(result.totalOrders).toBe(0);
            expect(result.fulfillmentRate).toBe(0);
            expect(result.avgFulfillmentTimeHours).toBe(0);
            expect(result.slaBreachRate).toBe(0);
            expect(result.inventorySummary).toEqual([]);
            expect(result.topMovingSkus).toEqual([]);
        });
    });
});
