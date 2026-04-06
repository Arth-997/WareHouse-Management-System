import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('q') q: string | undefined, @Request() req: any) {
    const clientId = req.user?.role === 'CLIENT_USER' ? req.user.clientId : undefined;
    return this.ordersService.findAll(q, clientId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
