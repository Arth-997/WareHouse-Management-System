import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from '../src/orders/orders.service';
import { PrismaService } from '../src/prisma/prisma.service';

// ── Shared Fixtures ──────────────────────────────────────────────────
const WAREHOUSE_ID = 'wh-001';
const CLIENT_ID = 'cl-001';
const CUSTOMER_ID = 'cu-001';
const USER_ID = 'usr-001';
const POSITION_ID = 'pos-001';
const SKU_ID = 'sku-001';
const ORDER_ID = 'ord-uuid-001';

const mockWarehouse = { id: WAREHOUSE_ID, code: 'WH-BL-01', name: 'Bangalore Hub', slaWarningLeadHours: 2 };
const mockClient = { id: CLIENT_ID, name: 'TechBrand', code: 'TB' };
const mockCustomer = { id: CUSTOMER_ID, name: 'RaviElec', code: 'RE' };
const mockSku = { id: SKU_ID, skuCode: 'SKU-001', description: 'Widget A' };
const mockPosition = { id: POSITION_ID, warehouseId: WAREHOUSE_ID, clientId: CLIENT_ID, skuId: SKU_ID, quantityOnHand: 100, quantityReserved: 20 };

const baseOrderData = {
    warehouseId: WAREHOUSE_ID,
    clientId: CLIENT_ID,
    priority: 'normal',
    shippingMethod: 'standard',
    billingCategory: 'storage_handling',
    deliveryAddress: { line1: '123 Main St' },
    lines: [{ skuId: SKU_ID, quantity: 10 }],
};

function makeMockOrder(overrides: any = {}) {
    return {
        id: ORDER_ID,
        orderRef: 'ORD-2026-0001',
        internalRef: null,
        warehouseId: WAREHOUSE_ID,
        warehouse: mockWarehouse,
        clientId: CLIENT_ID,
        client: mockClient,
        customerId: null,
        customer: null,
        status: 'received',
        priority: 'normal',
        shippingMethod: 'standard',
        billingCategory: 'storage_handling',
        deliveryAddress: {},
        slaStartAt: new Date(),
        slaDeadlineAt: new Date(Date.now() + 86400000),
        slaBreached: false,
        createdAt: new Date(),
        lines: [{ id: 'line-1', skuId: SKU_ID, sku: mockSku, quantity: 10, inventoryPositionId: POSITION_ID }],
        ...overrides,
    };
}

// ── Mock PrismaService ───────────────────────────────────────────────
function createMockPrisma() {
    return {
        order: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        inventoryPosition: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        inventoryMovement: {
            create: jest.fn(),
        },
        orderLine: {
            update: jest.fn(),
        },
    };
}

describe('OrdersService', () => {
    let service: OrdersService;
    let prisma: ReturnType<typeof createMockPrisma>;

    beforeEach(async () => {
        prisma = createMockPrisma();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
    });

    // ══════════════════════════════════════════════════════════════════
    //  1. ORDER CREATION (Admin/Operator direct path)
    // ══════════════════════════════════════════════════════════════════

    describe('create()', () => {
        it('should create an order and reserve inventory when stock is sufficient', async () => {
            // Arrange
            prisma.order.findFirst.mockResolvedValue(null); // no previous order for ref generation
            prisma.inventoryPosition.findFirst.mockResolvedValue(mockPosition);
            prisma.inventoryPosition.findUnique.mockResolvedValue(mockPosition);
            prisma.inventoryPosition.update.mockResolvedValue({});
            prisma.inventoryMovement.create.mockResolvedValue({});
            prisma.order.create.mockResolvedValue(makeMockOrder());

            // Act
            const result = await service.create(baseOrderData, USER_ID);

            // Assert
            expect(result.orderRef).toBe('ORD-2026-0001');
            expect(result.status).toBe('received');
            expect(prisma.inventoryPosition.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { quantityReserved: { increment: 10 } },
                }),
            );
            expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ movementType: 'reserve' }),
                }),
            );
        });

        it('should throw BadRequestException when warehouseId is missing', async () => {
            await expect(
                service.create({ ...baseOrderData, warehouseId: '' }, USER_ID),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when no lines provided', async () => {
            await expect(
                service.create({ ...baseOrderData, lines: [] }, USER_ID),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when quantity is <= 0', async () => {
            await expect(
                service.create({ ...baseOrderData, lines: [{ skuId: SKU_ID, quantity: 0 }] }, USER_ID),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when SKU has no inventory position', async () => {
            prisma.order.findFirst.mockResolvedValue(null);
            prisma.inventoryPosition.findFirst.mockResolvedValue(null);

            await expect(
                service.create(baseOrderData, USER_ID),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when available stock is insufficient', async () => {
            prisma.order.findFirst.mockResolvedValue(null);
            prisma.inventoryPosition.findFirst.mockResolvedValue({
                ...mockPosition,
                quantityOnHand: 10,
                quantityReserved: 5, // available = 5, requested = 10
            });

            await expect(
                service.create(baseOrderData, USER_ID),
            ).rejects.toThrow(/Insufficient stock/);
        });

        it('should handle multiple line items and validate each independently', async () => {
            const multiLineData = {
                ...baseOrderData,
                lines: [
                    { skuId: 'sku-1', quantity: 5 },
                    { skuId: 'sku-2', quantity: 3 },
                ],
            };

            prisma.order.findFirst.mockResolvedValue(null);
            // First SKU has enough stock
            prisma.inventoryPosition.findFirst
                .mockResolvedValueOnce({ ...mockPosition, id: 'pos-1', skuId: 'sku-1', quantityOnHand: 50, quantityReserved: 0 })
                .mockResolvedValueOnce(null); // Second SKU has no inventory

            await expect(
                service.create(multiLineData, USER_ID),
            ).rejects.toThrow(/No inventory found/);
        });
    });

    // ══════════════════════════════════════════════════════════════════
    //  2. ORDER STATUS FSM (Finite State Machine transitions)
    // ══════════════════════════════════════════════════════════════════

    describe('updateStatus()', () => {
        it('should transition from received → allocated', async () => {
            const order = makeMockOrder({ status: 'received' });
            prisma.order.findUnique.mockResolvedValue(order);
            prisma.order.update.mockResolvedValue({ ...order, status: 'allocated' });

            const result = await service.updateStatus(ORDER_ID, 'allocated', USER_ID);

            expect(result.status).toBe('allocated');
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ status: 'allocated' }) }),
            );
        });

        it('should transition through the full FSM: allocated → picked → packed → dispatched → delivered', async () => {
            const transitions = [
                { from: 'allocated', to: 'picked' },
                { from: 'picked', to: 'packed' },
                { from: 'packed', to: 'dispatched' },
                { from: 'dispatched', to: 'delivered' },
            ];

            for (const { from, to } of transitions) {
                const order = makeMockOrder({ status: from });
                prisma.order.findUnique.mockResolvedValue(order);
                prisma.order.update.mockResolvedValue({ ...order, status: to });
                prisma.inventoryPosition.findUnique.mockResolvedValue(mockPosition);
                prisma.inventoryPosition.update.mockResolvedValue({});
                prisma.inventoryMovement.create.mockResolvedValue({});

                const result = await service.updateStatus(ORDER_ID, to, USER_ID);
                expect(result.status).toBe(to);
            }
        });

        it('should reject skipping states (received → packed is invalid)', async () => {
            prisma.order.findUnique.mockResolvedValue(makeMockOrder({ status: 'received' }));

            await expect(
                service.updateStatus(ORDER_ID, 'packed', USER_ID),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject backwards transitions (picked → allocated is invalid)', async () => {
            prisma.order.findUnique.mockResolvedValue(makeMockOrder({ status: 'picked' }));

            await expect(
                service.updateStatus(ORDER_ID, 'allocated', USER_ID),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject an invalid status string', async () => {
            prisma.order.findUnique.mockResolvedValue(makeMockOrder({ status: 'received' }));

            await expect(
                service.updateStatus(ORDER_ID, 'flying', USER_ID),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException for a non-existent order', async () => {
            prisma.order.findUnique.mockResolvedValue(null);

            await expect(
                service.updateStatus('nonexistent', 'allocated', USER_ID),
            ).rejects.toThrow(NotFoundException);
        });

        it('should deduct OnHand and release Reserved when status moves to dispatched', async () => {
            const order = makeMockOrder({ status: 'packed' });
            prisma.order.findUnique.mockResolvedValue(order);
            prisma.inventoryPosition.findUnique.mockResolvedValue(mockPosition);
            prisma.inventoryPosition.update.mockResolvedValue({});
            prisma.inventoryMovement.create.mockResolvedValue({});
            prisma.order.update.mockResolvedValue({ ...order, status: 'dispatched' });

            await service.updateStatus(ORDER_ID, 'dispatched', USER_ID);

            expect(prisma.inventoryPosition.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        quantityOnHand: { decrement: 10 },
                        quantityReserved: { decrement: 10 },
                    },
                }),
            );
            expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ movementType: 'pick' }),
                }),
            );
        });

        it('should set slaBreached = true if dispatched past deadline', async () => {
            const pastDeadline = new Date(Date.now() - 3600_000); // 1 hour ago
            const order = makeMockOrder({ status: 'packed', slaDeadlineAt: pastDeadline });
            prisma.order.findUnique.mockResolvedValue(order);
            prisma.inventoryPosition.findUnique.mockResolvedValue(mockPosition);
            prisma.inventoryPosition.update.mockResolvedValue({});
            prisma.inventoryMovement.create.mockResolvedValue({});
            prisma.order.update.mockResolvedValue({ ...order, status: 'dispatched', slaBreached: true });

            await service.updateStatus(ORDER_ID, 'dispatched', USER_ID);

            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ slaBreached: true }),
                }),
            );
        });

        it('should set deliveredAt when status moves to delivered', async () => {
            const order = makeMockOrder({ status: 'dispatched' });
            prisma.order.findUnique.mockResolvedValue(order);
            prisma.order.update.mockResolvedValue({ ...order, status: 'delivered' });

            await service.updateStatus(ORDER_ID, 'delivered', USER_ID);

            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ deliveredAt: expect.any(Date) }),
                }),
            );
        });
    });

    // ══════════════════════════════════════════════════════════════════
    //  3. ORDER CANCELLATION
    // ══════════════════════════════════════════════════════════════════

    describe('cancel()', () => {
        it('should cancel an order and unreserve inventory', async () => {
            const order = makeMockOrder({ status: 'received' });
            prisma.order.findUnique.mockResolvedValue(order);
            prisma.inventoryPosition.findUnique.mockResolvedValue(mockPosition);
            prisma.inventoryPosition.update.mockResolvedValue({});
            prisma.inventoryMovement.create.mockResolvedValue({});
            prisma.order.delete.mockResolvedValue({});

            const result = await service.cancel(ORDER_ID, USER_ID);

            expect(result).toEqual({ ok: true });
            expect(prisma.inventoryPosition.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { quantityReserved: { decrement: 10 } },
                }),
            );
            expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ movementType: 'unreserve' }),
                }),
            );
        });

        it('should throw NotFoundException when order does not exist', async () => {
            prisma.order.findUnique.mockResolvedValue(null);

            await expect(service.cancel('invalid', USER_ID)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException when cancelling a dispatched order', async () => {
            prisma.order.findUnique.mockResolvedValue(makeMockOrder({ status: 'dispatched' }));

            await expect(service.cancel(ORDER_ID, USER_ID)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when cancelling a delivered order', async () => {
            prisma.order.findUnique.mockResolvedValue(makeMockOrder({ status: 'delivered' }));

            await expect(service.cancel(ORDER_ID, USER_ID)).rejects.toThrow(BadRequestException);
        });
    });

    // ══════════════════════════════════════════════════════════════════
    //  4. CUSTOMER ORDER REQUESTS
    // ══════════════════════════════════════════════════════════════════

    describe('createRequest()', () => {
        it('should create an order with status "requested" WITHOUT reserving inventory', async () => {
            prisma.order.findFirst.mockResolvedValue(null); // for ref generation
            prisma.order.create.mockResolvedValue(makeMockOrder({ status: 'requested', customerId: CUSTOMER_ID, customer: mockCustomer }));

            const result = await service.createRequest({
                ...baseOrderData,
                customerId: CUSTOMER_ID,
            });

            expect(result.status).toBe('requested');
            expect(prisma.inventoryPosition.findFirst).not.toHaveBeenCalled(); // NO inventory check
            expect(prisma.inventoryPosition.update).not.toHaveBeenCalled(); // NO reservation
        });

        it('should throw BadRequestException when customerId is missing', async () => {
            await expect(
                service.createRequest({ ...baseOrderData, customerId: '' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when line quantity is <= 0', async () => {
            await expect(
                service.createRequest({ ...baseOrderData, customerId: CUSTOMER_ID, lines: [{ skuId: SKU_ID, quantity: -1 }] }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('approveRequest()', () => {
        it('should approve a request, validate inventory, reserve stock, and set SLA', async () => {
            const requestedOrder = makeMockOrder({ status: 'requested', customerId: CUSTOMER_ID, customer: mockCustomer });
            prisma.order.findUnique.mockResolvedValue(requestedOrder);
            prisma.inventoryPosition.findFirst.mockResolvedValue(mockPosition);
            prisma.inventoryPosition.findUnique.mockResolvedValue(mockPosition);
            prisma.inventoryPosition.update.mockResolvedValue({});
            prisma.orderLine.update.mockResolvedValue({});
            prisma.inventoryMovement.create.mockResolvedValue({});
            prisma.order.update.mockResolvedValue({ ...requestedOrder, status: 'received', slaStartAt: new Date(), slaDeadlineAt: new Date() });

            const result = await service.approveRequest(ORDER_ID, USER_ID);

            expect(result.status).toBe('received');
            expect(prisma.inventoryPosition.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: { quantityReserved: { increment: 10 } } }),
            );
            expect(prisma.inventoryMovement.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ movementType: 'reserve' }) }),
            );
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ status: 'received', slaStartAt: expect.any(Date), slaDeadlineAt: expect.any(Date) }),
                }),
            );
        });

        it('should throw NotFoundException if order does not exist', async () => {
            prisma.order.findUnique.mockResolvedValue(null);

            await expect(service.approveRequest('bad-id', USER_ID)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if order is not in "requested" status', async () => {
            prisma.order.findUnique.mockResolvedValue(makeMockOrder({ status: 'received' }));

            await expect(service.approveRequest(ORDER_ID, USER_ID)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if inventory is insufficient during approval', async () => {
            const requestedOrder = makeMockOrder({ status: 'requested' });
            prisma.order.findUnique.mockResolvedValue(requestedOrder);
            prisma.inventoryPosition.findFirst.mockResolvedValue({
                ...mockPosition,
                quantityOnHand: 5,
                quantityReserved: 0, // available = 5, but requested = 10
            });

            await expect(service.approveRequest(ORDER_ID, USER_ID)).rejects.toThrow(/Insufficient stock/);
        });
    });

    describe('rejectRequest()', () => {
        it('should reject a request and set status to "rejected"', async () => {
            const requestedOrder = { id: ORDER_ID, status: 'requested' };
            prisma.order.findUnique.mockResolvedValue(requestedOrder);
            prisma.order.update.mockResolvedValue(makeMockOrder({ status: 'rejected' }));

            const result = await service.rejectRequest(ORDER_ID);

            expect(result.status).toBe('rejected');
            expect(prisma.inventoryPosition.update).not.toHaveBeenCalled(); // No inventory to release
        });

        it('should throw NotFoundException for non-existent order', async () => {
            prisma.order.findUnique.mockResolvedValue(null);
            await expect(service.rejectRequest('bad')).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if order is not "requested"', async () => {
            prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID, status: 'received' });
            await expect(service.rejectRequest(ORDER_ID)).rejects.toThrow(BadRequestException);
        });
    });

    // ══════════════════════════════════════════════════════════════════
    //  5. QUERY METHODS
    // ══════════════════════════════════════════════════════════════════

    describe('findAll()', () => {
        it('should return all orders when no filters applied', async () => {
            prisma.order.findMany.mockResolvedValue([makeMockOrder()]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(result[0].orderRef).toBe('ORD-2026-0001');
        });

        it('should filter by clientId for scoped CLIENT_USER queries', async () => {
            prisma.order.findMany.mockResolvedValue([]);

            await service.findAll(undefined, CLIENT_ID);

            expect(prisma.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { AND: expect.arrayContaining([{ clientId: CLIENT_ID }]) },
                }),
            );
        });

        it('should filter by customerId for scoped CUSTOMER queries', async () => {
            prisma.order.findMany.mockResolvedValue([]);

            await service.findAll(undefined, undefined, CUSTOMER_ID);

            expect(prisma.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { AND: expect.arrayContaining([{ customerId: CUSTOMER_ID }]) },
                }),
            );
        });

        it('should filter by status', async () => {
            prisma.order.findMany.mockResolvedValue([]);

            await service.findAll(undefined, undefined, undefined, 'requested');

            expect(prisma.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { AND: expect.arrayContaining([{ status: 'requested' }]) },
                }),
            );
        });
    });

    describe('findOne()', () => {
        it('should return a single order', async () => {
            prisma.order.findUnique.mockResolvedValue(makeMockOrder());
            const result = await service.findOne(ORDER_ID);
            expect(result?.orderRef).toBe('ORD-2026-0001');
        });

        it('should return null for non-existent order', async () => {
            prisma.order.findUnique.mockResolvedValue(null);
            const result = await service.findOne('bad');
            expect(result).toBeNull();
        });
    });
});
