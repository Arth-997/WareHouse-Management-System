import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    me(req: any): Promise<{
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
    createManagedUser(createAuthDto: CreateAuthDto): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        avatarUrl: string | undefined;
        clientId: string | undefined;
        customerId: string | undefined;
    }>;
    updateUser(id: string, updateAuthDto: UpdateAuthDto): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        avatarUrl: string | undefined;
        clientId: string | undefined;
        customerId: string | undefined;
    }>;
    deleteUser(id: string): Promise<{
        ok: boolean;
    }>;
}
