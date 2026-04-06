import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('q') q?: string) {
    return this.billingService.findAll(q);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }
}
