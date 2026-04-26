import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InventoryRequestsService } from '../src/inventory-requests/inventory-requests.service';
import { PrismaService } from '../src/prisma/prisma.service';

const WAREHOUSE_ID = 'wh-001';
const CLIENT_ID = 'cl-001';
const SKU_ID = 'sku-001';
const REQUEST_ID = 'req-001';
const USER_ID = 'usr-001';

const mockRequest = {
    id: REQUEST_ID,
    warehouseId: WAREHOUSE_ID,
    clientId: CLIENT_ID,
    skuId: SKU_ID,
    requestedQty: 50,
    status: 'pending',
    requestedById: USER_ID,
};

const includes = {
    warehouse: { select: { code: true, name: true } },
    client: { select: { code: true, name: true } },
    sku: { select: { skuCode: true, description: true } },
    requestedBy: { select: { name: true } },
};

function createMockPrisma() {
    return {
        inventoryRequest: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        inventoryPosition: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        inventoryMovement: {
            create: jest.fn(),
        },
    };
}

describe('InventoryRequestsService', () => {
    let service: InventoryRequestsService;
    let prisma: ReturnType<typeof createMockPrisma>;

    beforeEach(async () => {
        prisma = createMockPrisma();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryRequestsService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();
        service = module.get<InventoryRequestsService>(InventoryRequestsService);
    });

    // ═══════════════════════════════════════════════════════════════
    //  create() — Warehouse Operator creates a restock request
    // ═══════════════════════════════════════════════════════════════

    describe('create()', () => {
        it('should create a pending inventory request', async () => {
            prisma.inventoryRequest.create.mockResolvedValue(mockRequest);

            const result = await service.create({
                warehouseId: WAREHOUSE_ID,
                clientId: CLIENT_ID,
                skuId: SKU_ID,
                requestedQty: 50,
                requestedById: USER_ID,
            });

            expect(result.status).toBe('pending');
            expect(prisma.inventoryRequest.create).toHaveBeenCalled();
        });

        it('should throw BadRequestException when required fields are missing', async () => {
            await expect(
                service.create({ warehouseId: '', clientId: CLIENT_ID, skuId: SKU_ID, requestedQty: 50, requestedById: USER_ID }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when requestedQty is 0', async () => {
            await expect(
                service.create({ warehouseId: WAREHOUSE_ID, clientId: CLIENT_ID, skuId: SKU_ID, requestedQty: 0, requestedById: USER_ID }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  findAll() — Role-scoped listing
    // ═══════════════════════════════════════════════════════════════

    describe('findAll()', () => {
        it('should return all requests for Warehouse staff (no filter)', async () => {
            prisma.inventoryRequest.findMany.mockResolvedValue([mockRequest]);

            const result = await service.findAll({ role: 'WAREHOUSE_OPERATOR', id: USER_ID });

            expect(result).toHaveLength(1);
            expect(prisma.inventoryRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: {} }),
            );
        });

        it('should filter by clientId for CLIENT_USER role', async () => {
            prisma.inventoryRequest.findMany.mockResolvedValue([]);

            await service.findAll({ role: 'CLIENT_USER', clientId: CLIENT_ID, id: USER_ID });

            expect(prisma.inventoryRequest.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { clientId: CLIENT_ID } }),
            );
        });

        it('should return empty array for CLIENT_USER with no clientId', async () => {
            const result = await service.findAll({ role: 'CLIENT_USER', id: USER_ID });
            expect(result).toEqual([]);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  approve() — Client approves a pending request
    // ═══════════════════════════════════════════════════════════════

    describe('approve()', () => {
        it('should approve a pending request', async () => {
            prisma.inventoryRequest.findUnique.mockResolvedValue(mockRequest);
            prisma.inventoryRequest.update.mockResolvedValue({ ...mockRequest, status: 'approved' });

            const result = await service.approve(REQUEST_ID, { id: USER_ID, clientId: CLIENT_ID, role: 'CLIENT_USER' });

            expect(result.status).toBe('approved');
        });

        it('should throw NotFoundException when request does not exist', async () => {
            prisma.inventoryRequest.findUnique.mockResolvedValue(null);
            await expect(
                service.approve('bad', { id: USER_ID, clientId: CLIENT_ID, role: 'CLIENT_USER' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException when request is not pending', async () => {
            prisma.inventoryRequest.findUnique.mockResolvedValue({ ...mockRequest, status: 'approved' });
            await expect(
                service.approve(REQUEST_ID, { id: USER_ID, clientId: CLIENT_ID, role: 'CLIENT_USER' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw ForbiddenException when CLIENT_USER tries to approve another client\'s request', async () => {
            prisma.inventoryRequest.findUnique.mockResolvedValue(mockRequest);
            await expect(
                service.approve(REQUEST_ID, { id: USER_ID, clientId: 'other-client', role: 'CLIENT_USER' }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  reject() — Client rejects a pending request
    // ═══════════════════════════════════════════════════════════════

    describe('reject()', () => {
        it('should reject a pending request', async () => {
            prisma.inventoryRequest.findUnique.mockResolvedValue(mockRequest);
            prisma.inventoryRequest.update.mockResolvedValue({ ...mockRequest, status: 'rejected' });

            const result = await service.reject(REQUEST_ID, { id: USER_ID, clientId: CLIENT_ID, role: 'CLIENT_USER' });

            expect(result.status).toBe('rejected');
        });

        it('should throw ForbiddenException for cross-client rejection', async () => {
            prisma.inventoryRequest.findUnique.mockResolvedValue(mockRequest);
            await expect(
                service.reject(REQUEST_ID, { id: USER_ID, clientId: 'alien-client', role: 'CLIENT_USER' }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  confirmReceived() — Operator confirms physical receipt
    // ═══════════════════════════════════════════════════════════════

    describe('confirmReceived()', () => {
        it('should increment existing inventory position and log movement', async () => {
            prisma.inventoryRequest.findUnique.mockResolvedValue({ ...mockRequest, status: 'approved' });
            const existingPos = { id: 'pos-1', warehouseId: WAREHOUSE_ID, clientId: CLIENT_ID, skuId: SKU_ID, quantityOnHand: 100 };
            prisma.inventoryPosition.findFirst.mockResolvedValue(existingPos);
            prisma.inventoryPosition.update.mockResolvedValue({});
            prisma.inventoryMovement.create.mockResolvedValue({});
            prisma.inventoryRequest.update.mockResolvedValue({ ...mockRequest, status: 'received' });

            const result = await service.confirmReceived(REQUEST_ID, { id: USER_ID, role: 'WAREHOUSE_OPERATOR' });

            expect(result.status).toBe('received');
            expect(prisma.inventoryPosition.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: { quantityOnHand: { increment: 50 } } }),
            );
            expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        movementType: 'receive',
                        quantityBefore: 100,
                        quantityChange: 50,
                        quantityAfter: 150,
                    }),
                }),
            );
        });

        it('should create a new inventory position when none exists', async () => {
            prisma.inventoryRequest.findUnique.mockResolvedValue({ ...mockRequest, status: 'approved' });
            prisma.inventoryPosition.findFirst.mockResolvedValue(null);
            prisma.inventoryPosition.create.mockResolvedValue({});
            prisma.inventoryMovement.create.mockResolvedValue({});
            prisma.inventoryRequest.update.mockResolvedValue({ ...mockRequest, status: 'received' });

            await service.confirmReceived(REQUEST_ID, { id: USER_ID, role: 'WAREHOUSE_OPERATOR' });

            expect(prisma.inventoryPosition.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ quantityOnHand: 50 }) }),
            );
        });

        it('should throw BadRequestException when request is not approved', async () => {
            prisma.inventoryRequest.findUnique.mockResolvedValue(mockRequest); // status: pending
            await expect(
                service.confirmReceived(REQUEST_ID, { id: USER_ID, role: 'WAREHOUSE_OPERATOR' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException for non-existent request', async () => {
            prisma.inventoryRequest.findUnique.mockResolvedValue(null);
            await expect(
                service.confirmReceived('bad', { id: USER_ID, role: 'WAREHOUSE_OPERATOR' }),
            ).rejects.toThrow(NotFoundException);
        });
    });
});
