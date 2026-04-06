import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('warehouses')
export class WarehousesController {
    constructor(private readonly warehousesService: WarehousesService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Query('q') q?: string) {
        return this.warehousesService.findAll(q);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.warehousesService.findOne(id);
    }
}
