import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InventoryService } from '../src/inventory/inventory.service';
import { PrismaService } from '../src/prisma/prisma.service';

// ── Fixtures ─────────────────────────────────────────────────────────
const WAREHOUSE_ID = 'wh-001';
const CLIENT_ID = 'cl-001';
const SKU_ID = 'sku-001';
const USER_ID = 'usr-001';
const POSITION_ID = 'pos-001';

const mockSku = { id: SKU_ID, skuCode: 'SKU-001', description: 'Widget', storageType: 'normal', client: { name: 'TechBrand' } };
const mockClient = { id: CLIENT_ID, name: 'TechBrand' };
const mockWarehouse = { id: WAREHOUSE_ID, code: 'WH-BL-01' };

const mockPosition = {
    id: POSITION_ID,
    skuId: SKU_ID,
    sku: mockSku,
    clientId: CLIENT_ID,
    client: mockClient,
    warehouseId: WAREHOUSE_ID,
    warehouse: mockWarehouse,
    quantityOnHand: 100,
    quantityReserved: 20,
    expiryDate: null,
    createdAt: new Date(),
};

function createMockPrisma() {
    return {
        inventoryPosition: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        inventoryMovement: {
            create: jest.fn(),
        },
        sKU: {
            findMany: jest.fn(),
        },
    };
}

describe('InventoryService', () => {
    let service: InventoryService;
    let prisma: ReturnType<typeof createMockPrisma>;

    beforeEach(async () => {
        prisma = createMockPrisma();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();
        service = module.get<InventoryService>(InventoryService);
    });

    // ═══════════════════════════════════════════════════════════════
    //  findAll() — Listing inventory positions
    // ═══════════════════════════════════════════════════════════════

    describe('findAll()', () => {
        it('should return mapped inventory with calculated available field', async () => {
            prisma.inventoryPosition.findMany.mockResolvedValue([mockPosition]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(result[0].onHand).toBe(100);
            expect(result[0].reserved).toBe(20);
            expect(result[0].available).toBe(80); // 100 - 20
            expect(result[0].sku).toBe('SKU-001');
        });

        it('should filter by clientId (data scoping for CLIENT_USER)', async () => {
            prisma.inventoryPosition.findMany.mockResolvedValue([]);

            await service.findAll(undefined, CLIENT_ID);

            expect(prisma.inventoryPosition.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { AND: expect.arrayContaining([{ clientId: CLIENT_ID }]) },
                }),
            );
        });

        it('should apply search query filter', async () => {
            prisma.inventoryPosition.findMany.mockResolvedValue([]);

            await service.findAll('Widget');

            expect(prisma.inventoryPosition.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { AND: expect.arrayContaining([expect.objectContaining({ OR: expect.any(Array) })]) },
                }),
            );
        });

        it('should return empty array when no items found', async () => {
            prisma.inventoryPosition.findMany.mockResolvedValue([]);
            const result = await service.findAll();
            expect(result).toEqual([]);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  findOne() — Single position lookup
    // ═══════════════════════════════════════════════════════════════

    describe('findOne()', () => {
        it('should return a single mapped inventory position', async () => {
            prisma.inventoryPosition.findUnique.mockResolvedValue(mockPosition);
            const result = await service.findOne(POSITION_ID);
            expect(result?.available).toBe(80);
        });

        it('should return null when not found', async () => {
            prisma.inventoryPosition.findUnique.mockResolvedValue(null);
            const result = await service.findOne('bad');
            expect(result).toBeNull();
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  findSkus() — SKU registry lookup
    // ═══════════════════════════════════════════════════════════════

    describe('findSkus()', () => {
        it('should return all SKUs', async () => {
            prisma.sKU.findMany.mockResolvedValue([mockSku]);
            const result = await service.findSkus();
            expect(result).toHaveLength(1);
            expect(result[0].skuCode).toBe('SKU-001');
        });

        it('should filter by clientId', async () => {
            prisma.sKU.findMany.mockResolvedValue([]);
            await service.findSkus(CLIENT_ID);
            expect(prisma.sKU.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { clientId: CLIENT_ID } }),
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  receiveStock() — Physical stock receiving
    // ═══════════════════════════════════════════════════════════════

    describe('receiveStock()', () => {
        const receiveData = {
            warehouseId: WAREHOUSE_ID,
            clientId: CLIENT_ID,
            skuId: SKU_ID,
            quantity: 50,
            performedById: USER_ID,
        };

        it('should increment existing position on receive', async () => {
            prisma.inventoryPosition.findFirst.mockResolvedValue(mockPosition);
            prisma.inventoryPosition.update.mockResolvedValue({});
            prisma.inventoryMovement.create.mockResolvedValue({});

            const result = await service.receiveStock(receiveData);

            expect(result.ok).toBe(true);
            expect(result.quantityBefore).toBe(100);
            expect(result.quantityAfter).toBe(150);
            expect(prisma.inventoryPosition.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { quantityOnHand: { increment: 50 } },
                }),
            );
        });

        it('should create a new position when none exists', async () => {
            prisma.inventoryPosition.findFirst.mockResolvedValue(null);
            prisma.inventoryPosition.create.mockResolvedValue({});
            prisma.inventoryMovement.create.mockResolvedValue({});

            const result = await service.receiveStock(receiveData);

            expect(result.ok).toBe(true);
            expect(result.quantityBefore).toBe(0);
            expect(result.quantityAfter).toBe(50);
            expect(prisma.inventoryPosition.create).toHaveBeenCalled();
        });

        it('should log an inventory movement with type "receive"', async () => {
            prisma.inventoryPosition.findFirst.mockResolvedValue(mockPosition);
            prisma.inventoryPosition.update.mockResolvedValue({});
            prisma.inventoryMovement.create.mockResolvedValue({});

            await service.receiveStock(receiveData);

            expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        movementType: 'receive',
                        referenceType: 'Adjustment',
                        quantityBefore: 100,
                        quantityChange: 50,
                        quantityAfter: 150,
                    }),
                }),
            );
        });

        it('should throw BadRequestException when required fields are missing', async () => {
            await expect(
                service.receiveStock({ ...receiveData, warehouseId: '' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when quantity is 0', async () => {
            await expect(
                service.receiveStock({ ...receiveData, quantity: 0 }),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
