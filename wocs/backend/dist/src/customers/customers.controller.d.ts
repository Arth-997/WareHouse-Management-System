import { CustomersService } from './customers.service';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
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
