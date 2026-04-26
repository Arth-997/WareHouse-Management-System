import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.client.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: { id: true, code: true, name: true },
        });
    }
}
