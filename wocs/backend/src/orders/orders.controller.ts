import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('q') q: string | undefined,
    @Query('status') status: string | undefined,
    @Request() req: any,
  ) {
    const clientId = req.user?.role === 'CLIENT_USER' ? req.user.clientId : undefined;
    const customerId = req.user?.role === 'CUSTOMER' ? req.user.customerId : undefined;
    return this.ordersService.findAll(q, clientId, customerId, status);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.ordersService.create(body, req.user.id);
  }

  /** Customer places an order request (no inventory reservation) */
  @UseGuards(JwtAuthGuard)
  @Post('request')
  createRequest(@Body() body: any, @Request() req: any) {
    // Auto-set customerId from the logged-in customer's profile
    const customerId = req.user?.customerId || body.customerId;
    return this.ordersService.createRequest({ ...body, customerId });
  }

  /** Admin/Operator approves a customer request */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/approve')
  approveRequest(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.approveRequest(id, req.user.id);
  }

  /** Admin/Operator rejects a customer request */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/reject')
  rejectRequest(@Param('id') id: string) {
    return this.ordersService.rejectRequest(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
    return this.ordersService.updateStatus(id, status, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.cancel(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
