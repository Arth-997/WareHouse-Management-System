import { Module } from '@nestjs/common';
import { InventoryRequestsService } from './inventory-requests.service';
import { InventoryRequestsController } from './inventory-requests.controller';

@Module({
    controllers: [InventoryRequestsController],
    providers: [InventoryRequestsService],
})
export class InventoryRequestsModule { }
