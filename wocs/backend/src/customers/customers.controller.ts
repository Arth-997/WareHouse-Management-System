import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll() {
        return this.customersService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.customersService.findOne(id);
    }
}
