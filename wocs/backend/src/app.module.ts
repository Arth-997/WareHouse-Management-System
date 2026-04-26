import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { BillingModule } from './billing/billing.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InventoryRequestsModule } from './inventory-requests/inventory-requests.module';
import { ClientsModule } from './clients/clients.module';
import { CustomersModule } from './customers/customers.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    InventoryModule,
    OrdersModule,
    BillingModule,
    WarehousesModule,
    DashboardModule,
    InventoryRequestsModule,
    ClientsModule,
    CustomersModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
