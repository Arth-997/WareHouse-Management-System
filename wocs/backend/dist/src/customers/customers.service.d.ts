import { PrismaService } from '../prisma/prisma.service';
export declare class CustomersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        code: string;
        address: import("@prisma/client/runtime/client").JsonValue;
        contactEmail: string;
        phone: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        code: string;
        address: import("@prisma/client/runtime/client").JsonValue;
        contactEmail: string;
        phone: string | null;
    } | null>;
}
