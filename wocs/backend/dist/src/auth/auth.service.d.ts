import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly jwtService;
    private readonly prisma;
    constructor(jwtService: JwtService, prisma: PrismaService);
    private sanitizeUser;
    register(createAuthDto: CreateAuthDto): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        avatarUrl: string | undefined;
        clientId: string | undefined;
        customerId: string | undefined;
    }>;
    login(loginDto: LoginAuthDto): Promise<{
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            avatarUrl: string | undefined;
            clientId: string | undefined;
            customerId: string | undefined;
        };
    }>;
    me(user: any): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        avatarUrl: string | undefined;
        clientId: string | undefined;
        customerId: string | undefined;
    }>;
    listUsers(q?: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        avatarUrl: string | undefined;
        clientId: string | undefined;
        customerId: string | undefined;
    }[]>;
    createUser(createAuthDto: CreateAuthDto): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        avatarUrl: string | undefined;
        clientId: string | undefined;
        customerId: string | undefined;
    }>;
    updateUser(userId: string, updateDto: UpdateAuthDto): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        avatarUrl: string | undefined;
        clientId: string | undefined;
        customerId: string | undefined;
    }>;
    deleteUser(userId: string): Promise<{
        ok: boolean;
    }>;
}
