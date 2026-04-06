import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('q') q: string | undefined, @Request() req: any) {
    // CLIENT_USER only sees their own inventory
    const clientId = req.user?.role === 'CLIENT_USER' ? req.user.clientId : undefined;
    return this.inventoryService.findAll(q, clientId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }
}
