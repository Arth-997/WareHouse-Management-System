import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [PrismaModule, AuthModule, InventoryModule, OrdersModule, BillingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
