import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { InventoryRequestsService } from './inventory-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('inventory-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryRequestsController {
    constructor(private readonly service: InventoryRequestsService) { }

    @Post()
    @Roles('IT_ADMINISTRATOR', 'WAREHOUSE_MANAGER', 'WAREHOUSE_OPERATOR')
    create(@Body() body: any, @Request() req: any) {
        return this.service.create({
            ...body,
            requestedById: req.user.id,
        });
    }

    @Get()
    findAll(@Request() req: any) {
        return this.service.findAll(req.user);
    }

    @Patch(':id/approve')
    @Roles('CLIENT_USER', 'IT_ADMINISTRATOR')
    approve(@Param('id') id: string, @Request() req: any) {
        return this.service.approve(id, req.user);
    }

    @Patch(':id/reject')
    @Roles('CLIENT_USER', 'IT_ADMINISTRATOR')
    reject(@Param('id') id: string, @Request() req: any) {
        return this.service.reject(id, req.user);
    }

    @Patch(':id/received')
    @Roles('IT_ADMINISTRATOR', 'WAREHOUSE_MANAGER', 'WAREHOUSE_OPERATOR')
    confirmReceived(@Param('id') id: string, @Request() req: any) {
        return this.service.confirmReceived(id, req.user);
    }
}
