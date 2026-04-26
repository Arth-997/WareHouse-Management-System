"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcryptjs"));
const connectionString = process.env.DATABASE_URL;
if (!connectionString)
    throw new Error('DATABASE_URL is not set');
const prisma = new client_1.PrismaClient({
    adapter: new adapter_pg_1.PrismaPg(connectionString),
});
async function main() {
    console.log('🌱 Seeding database...');
    const hash = (pw) => bcrypt.hashSync(pw, 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@wocs.com' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@wocs.com',
            password: hash('admin123'),
            role: 'IT_ADMINISTRATOR',
        },
    });
    const manager = await prisma.user.upsert({
        where: { email: 'manager@wocs.com' },
        update: {},
        create: {
            name: 'Raj Sharma',
            email: 'manager@wocs.com',
            password: hash('manager123'),
            role: 'WAREHOUSE_MANAGER',
        },
    });
    const operator = await prisma.user.upsert({
        where: { email: 'operator@wocs.com' },
        update: {},
        create: {
            name: 'Priya Patel',
            email: 'operator@wocs.com',
            password: hash('operator123'),
            role: 'WAREHOUSE_OPERATOR',
        },
    });
    const finance = await prisma.user.upsert({
        where: { email: 'finance@wocs.com' },
        update: {},
        create: {
            name: 'Ankit Verma',
            email: 'finance@wocs.com',
            password: hash('finance123'),
            role: 'FINANCE',
        },
    });
    const clientUser = await prisma.user.upsert({
        where: { email: 'client@techcorp.com' },
        update: {},
        create: {
            name: 'Sneha Gupta',
            email: 'client@techcorp.com',
            password: hash('client123'),
            role: 'CLIENT_USER',
        },
    });
    console.log('✅ Users seeded');
    const wh1 = await prisma.warehouse.upsert({
        where: { code: 'WH-MUM-01' },
        update: {},
        create: {
            code: 'WH-MUM-01',
            name: 'Mumbai Central Warehouse',
            type: 'fulfillment',
            timezone: 'Asia/Kolkata',
            address: 'Plot 42, MIDC Andheri East, Mumbai 400093',
            slaWarningLeadHours: 2,
            lowInventoryThresholdPct: 20,
        },
    });
    const wh2 = await prisma.warehouse.upsert({
        where: { code: 'WH-DEL-01' },
        update: {},
        create: {
            code: 'WH-DEL-01',
            name: 'Delhi Distribution Hub',
            type: 'storage_only',
            timezone: 'Asia/Kolkata',
            address: '17-B, Okhla Industrial Area Phase II, New Delhi 110020',
            slaWarningLeadHours: 3,
            lowInventoryThresholdPct: 15,
        },
    });
    const wh3 = await prisma.warehouse.upsert({
        where: { code: 'WH-BLR-01' },
        update: {},
        create: {
            code: 'WH-BLR-01',
            name: 'Bangalore Cold Storage',
            type: 'temperature_sensitive',
            timezone: 'Asia/Kolkata',
            address: '23, Electronic City Phase 1, Bangalore 560100',
            slaWarningLeadHours: 1,
            lowInventoryThresholdPct: 25,
            mandatorySerialCaptureDefault: true,
        },
    });
    const wh4 = await prisma.warehouse.upsert({
        where: { code: 'WH-CHN-01' },
        update: {},
        create: {
            code: 'WH-CHN-01',
            name: 'Chennai Port Warehouse',
            type: 'fulfillment',
            timezone: 'Asia/Kolkata',
            address: '8, Ambattur Industrial Estate, Chennai 600058',
            isActive: false,
            slaWarningLeadHours: 2,
        },
    });
    const wh5 = await prisma.warehouse.upsert({
        where: { code: 'WH-KOL-01' },
        update: {},
        create: {
            code: 'WH-KOL-01',
            name: 'Kolkata Regional Center',
            type: 'storage_only',
            timezone: 'Asia/Kolkata',
            address: '56, Salt Lake Sector V, Kolkata 700091',
            slaWarningLeadHours: 2,
        },
    });
    console.log('✅ Warehouses seeded');
    const techCorp = await prisma.client.upsert({
        where: { code: 'TECHCORP' },
        update: {},
        create: {
            code: 'TECHCORP',
            name: 'TechCorp India',
            contactEmail: 'ops@techcorp.in',
            billingCycleDay: 1,
        },
    });
    const globalRetail = await prisma.client.upsert({
        where: { code: 'GLOBALRET' },
        update: {},
        create: {
            code: 'GLOBALRET',
            name: 'Global Retail Ltd',
            contactEmail: 'warehouse@globalretail.com',
            billingCycleDay: 15,
        },
    });
    const fastMart = await prisma.client.upsert({
        where: { code: 'FASTMART' },
        update: {},
        create: {
            code: 'FASTMART',
            name: 'FastMart Solutions',
            contactEmail: 'logistics@fastmart.in',
            billingCycleDay: 1,
        },
    });
    console.log('✅ Clients seeded');
    await prisma.user.update({
        where: { id: clientUser.id },
        data: { clientId: techCorp.id },
    });
    const raviElec = await prisma.customer.upsert({
        where: { code: 'RAVIELEC' },
        update: {},
        create: {
            code: 'RAVIELEC',
            name: 'Ravi Electronics',
            contactEmail: 'orders@ravielec.in',
            phone: '+91-9876543210',
            address: { line1: '12, MG Road', city: 'Mumbai', state: 'Maharashtra', zip: '400001' },
        },
    });
    const quickBuy = await prisma.customer.upsert({
        where: { code: 'QUICKBUY' },
        update: {},
        create: {
            code: 'QUICKBUY',
            name: 'QuickBuy Store',
            contactEmail: 'supply@quickbuy.com',
            phone: '+91-9988776655',
            address: { line1: '45, Rajaji Nagar', city: 'Bangalore', state: 'Karnataka', zip: '560010' },
        },
    });
    const cityMart = await prisma.customer.upsert({
        where: { code: 'CITYMART' },
        update: {},
        create: {
            code: 'CITYMART',
            name: 'CityMart Retail',
            contactEmail: 'procurement@citymart.in',
            phone: '+91-9112233445',
            address: { line1: '78, Connaught Place', city: 'New Delhi', state: 'Delhi', zip: '110001' },
        },
    });
    console.log('✅ Customers seeded');
    const customerUser = await prisma.user.upsert({
        where: { email: 'customer@ravielec.in' },
        update: {},
        create: {
            name: 'Ravi Kumar',
            email: 'customer@ravielec.in',
            password: hash('customer123'),
            role: 'CUSTOMER',
            customerId: raviElec.id,
        },
    });
    console.log('✅ Customer user seeded');
    const skus = await Promise.all([
        prisma.sKU.upsert({
            where: { id: 'sku-1' },
            update: {},
            create: { id: 'sku-1', clientId: techCorp.id, skuCode: 'TC-LAPTOP-15', description: 'Laptop 15" Pro', storageType: 'normal', unitOfMeasure: 'unit', barcode: '8901234560001' },
        }),
        prisma.sKU.upsert({
            where: { id: 'sku-2' },
            update: {},
            create: { id: 'sku-2', clientId: techCorp.id, skuCode: 'TC-MOUSE-WL', description: 'Wireless Mouse', storageType: 'normal', unitOfMeasure: 'unit', barcode: '8901234560002' },
        }),
        prisma.sKU.upsert({
            where: { id: 'sku-3' },
            update: {},
            create: { id: 'sku-3', clientId: techCorp.id, skuCode: 'TC-KEYB-MK', description: 'Mechanical Keyboard', storageType: 'normal', unitOfMeasure: 'unit', barcode: '8901234560003' },
        }),
        prisma.sKU.upsert({
            where: { id: 'sku-4' },
            update: {},
            create: { id: 'sku-4', clientId: techCorp.id, skuCode: 'TC-MON-27', description: '27" 4K Monitor', storageType: 'normal', unitOfMeasure: 'unit', barcode: '8901234560004' },
        }),
        prisma.sKU.upsert({
            where: { id: 'sku-5' },
            update: {},
            create: { id: 'sku-5', clientId: globalRetail.id, skuCode: 'GR-SHIRT-M', description: 'Cotton Shirt - Medium', storageType: 'normal', unitOfMeasure: 'unit', trackBatch: true },
        }),
        prisma.sKU.upsert({
            where: { id: 'sku-6' },
            update: {},
            create: { id: 'sku-6', clientId: globalRetail.id, skuCode: 'GR-JEANS-32', description: 'Denim Jeans - 32W', storageType: 'normal', unitOfMeasure: 'unit', trackBatch: true },
        }),
        prisma.sKU.upsert({
            where: { id: 'sku-7' },
            update: {},
            create: { id: 'sku-7', clientId: globalRetail.id, skuCode: 'GR-SHOE-42', description: 'Running Shoes - EU42', storageType: 'normal', unitOfMeasure: 'pair' },
        }),
        prisma.sKU.upsert({
            where: { id: 'sku-8' },
            update: {},
            create: { id: 'sku-8', clientId: fastMart.id, skuCode: 'FM-YOGURT-L', description: 'Greek Yogurt 1L', storageType: 'cold', unitOfMeasure: 'unit', trackExpiry: true },
        }),
        prisma.sKU.upsert({
            where: { id: 'sku-9' },
            update: {},
            create: { id: 'sku-9', clientId: fastMart.id, skuCode: 'FM-JUICE-OJ', description: 'Fresh Orange Juice 500ml', storageType: 'cold', unitOfMeasure: 'unit', trackExpiry: true },
        }),
        prisma.sKU.upsert({
            where: { id: 'sku-10' },
            update: {},
            create: { id: 'sku-10', clientId: fastMart.id, skuCode: 'FM-RICE-5KG', description: 'Basmati Rice 5kg', storageType: 'normal', unitOfMeasure: 'bag' },
        }),
    ]);
    console.log('✅ SKUs seeded');
    const invData = [
        { warehouseId: wh1.id, clientId: techCorp.id, skuId: skus[0].id, quantityOnHand: 150, quantityReserved: 0 },
        { warehouseId: wh1.id, clientId: techCorp.id, skuId: skus[1].id, quantityOnHand: 500, quantityReserved: 0 },
        { warehouseId: wh1.id, clientId: techCorp.id, skuId: skus[2].id, quantityOnHand: 320, quantityReserved: 0 },
        { warehouseId: wh2.id, clientId: techCorp.id, skuId: skus[3].id, quantityOnHand: 75, quantityReserved: 0 },
        { warehouseId: wh2.id, clientId: globalRetail.id, skuId: skus[4].id, quantityOnHand: 1200, quantityReserved: 0, batchNumber: 'BATCH-2026-Q1' },
        { warehouseId: wh2.id, clientId: globalRetail.id, skuId: skus[5].id, quantityOnHand: 800, quantityReserved: 0, batchNumber: 'BATCH-2026-Q1' },
        { warehouseId: wh1.id, clientId: globalRetail.id, skuId: skus[6].id, quantityOnHand: 450, quantityReserved: 0 },
        { warehouseId: wh3.id, clientId: fastMart.id, skuId: skus[7].id, quantityOnHand: 600, quantityReserved: 0, expiryDate: new Date('2026-05-15') },
        { warehouseId: wh3.id, clientId: fastMart.id, skuId: skus[8].id, quantityOnHand: 400, quantityReserved: 0, expiryDate: new Date('2026-04-30') },
        { warehouseId: wh5.id, clientId: fastMart.id, skuId: skus[9].id, quantityOnHand: 2000, quantityReserved: 0 },
        { warehouseId: wh1.id, clientId: fastMart.id, skuId: skus[9].id, quantityOnHand: 1500, quantityReserved: 0 },
        { warehouseId: wh2.id, clientId: techCorp.id, skuId: skus[0].id, quantityOnHand: 90, quantityReserved: 0 },
    ];
    for (const inv of invData) {
        const existing = await prisma.inventoryPosition.findFirst({
            where: {
                warehouseId: inv.warehouseId,
                clientId: inv.clientId,
                skuId: inv.skuId,
            },
        });
        if (existing) {
            await prisma.inventoryPosition.update({
                where: { id: existing.id },
                data: { quantityOnHand: inv.quantityOnHand, quantityReserved: inv.quantityReserved },
            });
        }
        else {
            await prisma.inventoryPosition.create({ data: inv });
        }
    }
    console.log('✅ Inventory positions seeded');
    await prisma.orderLine.deleteMany({});
    await prisma.order.deleteMany({});
    const now = Date.now();
    const h = (hours) => new Date(now + hours * 3600_000);
    const ago = (hours) => new Date(now - hours * 3600_000);
    const createOrderWithLines = async (orderData, lines) => {
        const order = await prisma.order.create({ data: orderData });
        for (const line of lines) {
            await prisma.orderLine.create({
                data: { orderId: order.id, skuId: line.skuId, quantity: line.quantity },
            });
        }
        return order;
    };
    await createOrderWithLines({ orderRef: 'ORD-2026-0001', warehouseId: wh1.id, clientId: techCorp.id, customerId: raviElec.id, status: 'received', priority: 'normal', shippingMethod: 'standard', billingCategory: 'storage_handling', deliveryAddress: { city: 'Mumbai', zip: '400001' }, slaStartAt: ago(2), slaDeadlineAt: h(22) }, [{ skuId: skus[0].id, quantity: 10 }, { skuId: skus[1].id, quantity: 25 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0002', warehouseId: wh1.id, clientId: techCorp.id, customerId: quickBuy.id, status: 'allocated', priority: 'high', shippingMethod: 'express', billingCategory: 'express_fulfillment', deliveryAddress: { city: 'Pune', zip: '411001' }, slaStartAt: ago(4), slaDeadlineAt: h(20) }, [{ skuId: skus[2].id, quantity: 15 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0003', warehouseId: wh2.id, clientId: globalRetail.id, customerId: cityMart.id, status: 'picked', priority: 'normal', shippingMethod: 'standard', billingCategory: 'storage_handling', deliveryAddress: { city: 'Delhi', zip: '110001' }, slaStartAt: ago(6), slaDeadlineAt: h(18) }, [{ skuId: skus[4].id, quantity: 50 }, { skuId: skus[5].id, quantity: 30 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0004', warehouseId: wh2.id, clientId: globalRetail.id, customerId: raviElec.id, status: 'packed', priority: 'normal', shippingMethod: 'standard', billingCategory: 'storage_handling', deliveryAddress: { city: 'Noida', zip: '201301' }, slaStartAt: ago(8), slaDeadlineAt: h(16) }, [{ skuId: skus[5].id, quantity: 20 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0005', warehouseId: wh1.id, clientId: fastMart.id, customerId: quickBuy.id, status: 'allocated', priority: 'high', shippingMethod: 'express', billingCategory: 'express_fulfillment', deliveryAddress: { city: 'Mumbai', zip: '400051' }, slaStartAt: ago(10), slaDeadlineAt: h(1.5) }, [{ skuId: skus[9].id, quantity: 100 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0006', warehouseId: wh3.id, clientId: fastMart.id, customerId: cityMart.id, status: 'picked', priority: 'normal', shippingMethod: 'cold_chain', billingCategory: 'cold_storage', deliveryAddress: { city: 'Bangalore', zip: '560001' }, slaStartAt: ago(12), slaDeadlineAt: h(0.5) }, [{ skuId: skus[7].id, quantity: 80 }, { skuId: skus[8].id, quantity: 40 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0007', warehouseId: wh5.id, clientId: fastMart.id, customerId: raviElec.id, status: 'received', priority: 'normal', shippingMethod: 'standard', billingCategory: 'storage_handling', deliveryAddress: { city: 'Kolkata', zip: '700001' }, slaStartAt: ago(30), slaDeadlineAt: ago(6), slaBreached: true }, [{ skuId: skus[9].id, quantity: 200 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0008', warehouseId: wh1.id, clientId: techCorp.id, customerId: quickBuy.id, status: 'allocated', priority: 'high', shippingMethod: 'express', billingCategory: 'express_fulfillment', deliveryAddress: { city: 'Thane', zip: '400601' }, slaStartAt: ago(28), slaDeadlineAt: ago(4), slaBreached: true }, [{ skuId: skus[0].id, quantity: 5 }, { skuId: skus[1].id, quantity: 10 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0010', warehouseId: wh1.id, clientId: techCorp.id, customerId: cityMart.id, status: 'dispatched', priority: 'normal', shippingMethod: 'standard', billingCategory: 'storage_handling', deliveryAddress: { city: 'Mumbai', zip: '400018' }, slaStartAt: ago(48), slaDeadlineAt: ago(24), dispatchedAt: ago(26) }, [{ skuId: skus[0].id, quantity: 8 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0011', warehouseId: wh3.id, clientId: fastMart.id, customerId: raviElec.id, status: 'dispatched', priority: 'high', shippingMethod: 'cold_chain', billingCategory: 'cold_storage', deliveryAddress: { city: 'Mysore', zip: '570001' }, slaStartAt: ago(36), slaDeadlineAt: ago(12), dispatchedAt: ago(14) }, [{ skuId: skus[8].id, quantity: 60 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0012', warehouseId: wh2.id, clientId: globalRetail.id, customerId: raviElec.id, status: 'delivered', priority: 'normal', shippingMethod: 'standard', billingCategory: 'storage_handling', deliveryAddress: { city: 'Delhi', zip: '110016' }, slaStartAt: ago(72), slaDeadlineAt: ago(48), dispatchedAt: ago(50), deliveredAt: ago(46) }, [{ skuId: skus[4].id, quantity: 100 }, { skuId: skus[6].id, quantity: 30 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0013', warehouseId: wh1.id, clientId: techCorp.id, customerId: quickBuy.id, status: 'delivered', priority: 'normal', shippingMethod: 'express', billingCategory: 'express_fulfillment', deliveryAddress: { city: 'Pune', zip: '411014' }, slaStartAt: ago(96), slaDeadlineAt: ago(72), dispatchedAt: ago(74), deliveredAt: ago(70) }, [{ skuId: skus[1].id, quantity: 50 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0014', warehouseId: wh5.id, clientId: fastMart.id, customerId: cityMart.id, status: 'delivered', priority: 'normal', shippingMethod: 'standard', billingCategory: 'storage_handling', deliveryAddress: { city: 'Howrah', zip: '711101' }, slaStartAt: ago(120), slaDeadlineAt: ago(96), dispatchedAt: ago(98), deliveredAt: ago(94) }, [{ skuId: skus[9].id, quantity: 150 }]);
    await createOrderWithLines({ orderRef: 'ORD-2026-0015', warehouseId: wh3.id, clientId: fastMart.id, customerId: raviElec.id, status: 'delivered', priority: 'high', shippingMethod: 'cold_chain', billingCategory: 'cold_storage', deliveryAddress: { city: 'Bangalore', zip: '560034' }, slaStartAt: ago(144), slaDeadlineAt: ago(120), dispatchedAt: ago(122), deliveredAt: ago(118) }, [{ skuId: skus[7].id, quantity: 120 }]);
    console.log('✅ Orders with line items seeded');
    await prisma.inventoryMovement.deleteMany({});
    const movements = [
        { movementType: 'receive', referenceType: 'Adjustment', quantityBefore: 0, quantityChange: 150, quantityAfter: 150, performedById: operator.id, reasonCategory: 'initial_stock' },
        { movementType: 'pick', referenceType: 'Order', referenceId: 'ORD-2026-0001', quantityBefore: 150, quantityChange: -30, quantityAfter: 120, performedById: operator.id, reasonCategory: 'order_fulfillment' },
        { movementType: 'receive', referenceType: 'Adjustment', quantityBefore: 0, quantityChange: 500, quantityAfter: 500, performedById: operator.id, reasonCategory: 'initial_stock' },
        { movementType: 'adjust', referenceType: 'Adjustment', quantityBefore: 500, quantityChange: -10, quantityAfter: 490, performedById: manager.id, reasonCategory: 'damaged' },
    ];
    for (const mv of movements) {
        await prisma.inventoryMovement.create({ data: mv });
    }
    console.log('✅ Inventory movements seeded');
    await prisma.inventoryRequest.deleteMany({});
    const irData = [
        { warehouseId: wh1.id, clientId: techCorp.id, skuId: skus[0].id, requestedQty: 50, status: 'pending', notes: 'Running low on laptops for Q2 orders', requestedById: manager.id },
        { warehouseId: wh2.id, clientId: globalRetail.id, skuId: skus[4].id, requestedQty: 300, status: 'approved', notes: 'Need shirts for upcoming sale season', requestedById: operator.id, respondedAt: ago(12) },
        { warehouseId: wh3.id, clientId: fastMart.id, skuId: skus[7].id, requestedQty: 200, status: 'received', notes: 'Yogurt restocking', requestedById: manager.id, respondedAt: ago(48), receivedAt: ago(24) },
        { warehouseId: wh1.id, clientId: techCorp.id, skuId: skus[1].id, requestedQty: 100, status: 'rejected', notes: 'Mouse stock replenishment', requestedById: operator.id, respondedAt: ago(72) },
    ];
    for (const ir of irData) {
        await prisma.inventoryRequest.create({ data: ir });
    }
    console.log('✅ Inventory requests seeded');
    console.log('\n🎉 Database seeded successfully!');
    console.log('   Admin login:    admin@wocs.com / admin123');
    console.log('   Customer login: customer@ravielec.in / customer123');
}
main()
    .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map