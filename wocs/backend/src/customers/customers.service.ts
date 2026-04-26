import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.customer.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: { id: true, code: true, name: true, contactEmail: true, phone: true, address: true },
        });
    }

    async findOne(id: string) {
        return this.prisma.customer.findUnique({
            where: { id },
            select: { id: true, code: true, name: true, contactEmail: true, phone: true, address: true },
        });
    }
}
