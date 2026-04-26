import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('q') q: string | undefined, @Request() req: any) {
    const clientId = req.user?.role === 'CLIENT_USER' ? req.user.clientId : undefined;
    return this.inventoryService.findAll(q, clientId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('skus')
  findSkus(@Query('clientId') clientId?: string) {
    return this.inventoryService.findSkus(clientId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('receive')
  receiveStock(@Body() body: any, @Request() req: any) {
    return this.inventoryService.receiveStock({
      ...body,
      performedById: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }
}

