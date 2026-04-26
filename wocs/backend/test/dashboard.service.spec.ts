import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../src/dashboard/dashboard.service';
import { PrismaService } from '../src/prisma/prisma.service';

const now = new Date();
const futureDeadline = new Date(now.getTime() + 86400000); // 24h from now
const pastDeadline = new Date(now.getTime() - 3600000); // 1h ago
const warningDeadline = new Date(now.getTime() + 3600000); // 1h from now (within 2h warning)

const mockWarehouse = {
    id: 'wh-1',
    code: 'WH-BL-01',
    name: 'Bangalore Hub',
    address: '123 Street, Bangalore',
    isActive: true,
    slaWarningLeadHours: 2,
    inventoryPositions: [{ quantityOnHand: 100 }, { quantityOnHand: 50 }],
    _count: { orders: 3 },
};

const mockOrders = [
    { id: '1', orderRef: 'ORD-001', status: 'received', warehouse: { ...mockWarehouse }, client: { name: 'TechBrand' }, slaDeadlineAt: futureDeadline, slaBreached: false, createdAt: now },
    { id: '2', orderRef: 'ORD-002', status: 'delivered', warehouse: { ...mockWarehouse }, client: { name: 'TechBrand' }, slaDeadlineAt: pastDeadline, slaBreached: false, createdAt: now },
    { id: '3', orderRef: 'ORD-003', status: 'picked', warehouse: { ...mockWarehouse }, client: { name: 'OtherBrand' }, slaDeadlineAt: pastDeadline, slaBreached: true, createdAt: now },
    { id: '4', orderRef: 'ORD-004', status: 'packed', warehouse: { ...mockWarehouse }, client: { name: 'TechBrand' }, slaDeadlineAt: warningDeadline, slaBreached: false, createdAt: now },
];

const mockInventory = [
    { sku: { skuCode: 'SKU-A' }, warehouse: mockWarehouse },
    { sku: { skuCode: 'SKU-B' }, warehouse: mockWarehouse },
    { sku: { skuCode: 'SKU-A' }, warehouse: mockWarehouse }, // duplicate SKU code
];

function createMockPrisma() {
    return {
        inventoryPosition: { findMany: jest.fn() },
        order: { findMany: jest.fn() },
        warehouse: { findMany: jest.fn() },
    };
}

describe('DashboardService', () => {
    let service: DashboardService;
    let prisma: ReturnType<typeof createMockPrisma>;

    beforeEach(async () => {
        prisma = createMockPrisma();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();
        service = module.get<DashboardService>(DashboardService);
    });

    describe('getStats()', () => {
        beforeEach(() => {
            prisma.inventoryPosition.findMany.mockResolvedValue(mockInventory);
            prisma.order.findMany.mockResolvedValue(mockOrders);
            prisma.warehouse.findMany.mockResolvedValue([mockWarehouse]);
        });

        it('should calculate totalSkus as unique SKU codes', async () => {
            const result = await service.getStats();
            expect(result.totalSkus).toBe(2); // SKU-A and SKU-B (deduplicated)
        });

        it('should calculate activeOrders as non-delivered orders', async () => {
            const result = await service.getStats();
            expect(result.activeOrders).toBe(3); // ORD-001 (received), ORD-003 (picked), ORD-004 (packed)
        });

        it('should count SLA breaches (breached flag or past deadline)', async () => {
            const result = await service.getStats();
            expect(result.slaBreaches).toBe(1); // ORD-003 has slaBreached=true
        });

        it('should count SLA warnings (within warning window but not breached)', async () => {
            const result = await service.getStats();
            expect(result.slaWarnings).toBe(1); // ORD-004 deadline is within 2h warning
        });

        it('should return at most 5 recent orders', async () => {
            const result = await service.getStats();
            expect(result.recentOrders.length).toBeLessThanOrEqual(5);
            expect(result.recentOrders[0].orderRef).toBe('ORD-001');
        });

        it('should return warehouse stats with capacity percentage', async () => {
            const result = await service.getStats();
            expect(result.warehouses).toHaveLength(1);
            expect(result.warehouses[0].code).toBe('WH-BL-01');
            expect(result.warehouses[0].isActive).toBe(true);
            expect(result.warehouses[0].capacityPct).toBeGreaterThan(0);
        });

        it('should handle empty data gracefully', async () => {
            prisma.inventoryPosition.findMany.mockResolvedValue([]);
            prisma.order.findMany.mockResolvedValue([]);
            prisma.warehouse.findMany.mockResolvedValue([]);

            const result = await service.getStats();

            expect(result.totalSkus).toBe(0);
            expect(result.activeOrders).toBe(0);
            expect(result.slaBreaches).toBe(0);
            expect(result.slaWarnings).toBe(0);
            expect(result.recentOrders).toEqual([]);
            expect(result.warehouses).toEqual([]);
        });
    });
});
