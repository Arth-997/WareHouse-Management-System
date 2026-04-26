"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const inventory_module_1 = require("./inventory/inventory.module");
const orders_module_1 = require("./orders/orders.module");
const billing_module_1 = require("./billing/billing.module");
const warehouses_module_1 = require("./warehouses/warehouses.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const inventory_requests_module_1 = require("./inventory-requests/inventory-requests.module");
const clients_module_1 = require("./clients/clients.module");
const customers_module_1 = require("./customers/customers.module");
const reports_module_1 = require("./reports/reports.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            inventory_module_1.InventoryModule,
            orders_module_1.OrdersModule,
            billing_module_1.BillingModule,
            warehouses_module_1.WarehousesModule,
            dashboard_module_1.DashboardModule,
            inventory_requests_module_1.InventoryRequestsModule,
            clients_module_1.ClientsModule,
            customers_module_1.CustomersModule,
            reports_module_1.ReportsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map