import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('analytics')
    getAnalytics() {
        return this.reportsService.getAnalytics();
    }
}
