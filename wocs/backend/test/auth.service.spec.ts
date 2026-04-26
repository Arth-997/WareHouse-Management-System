import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

jest.mock('bcryptjs');

const USER_ID = 'usr-001';
const mockUser = {
    id: USER_ID,
    name: 'Admin User',
    email: 'admin@wocs.com',
    role: 'IT_ADMINISTRATOR',
    avatarUrl: null,
    clientId: null,
    customerId: null,
    password: '$2a$10$hashedpassword',
};

function createMockPrisma() {
    return {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };
}

function createMockJwt() {
    return {
        signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
    };
}

describe('AuthService', () => {
    let service: AuthService;
    let prisma: ReturnType<typeof createMockPrisma>;
    let jwt: ReturnType<typeof createMockJwt>;

    beforeEach(async () => {
        prisma = createMockPrisma();
        jwt = createMockJwt();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: prisma },
                { provide: JwtService, useValue: jwt },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    // ═══════════════════════════════════════════════════════════════
    //  register()
    // ═══════════════════════════════════════════════════════════════

    describe('register()', () => {
        it('should create a user with hashed password', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed123');
            prisma.user.findUnique.mockResolvedValue(null); // no existing user
            prisma.user.create.mockResolvedValue(mockUser);

            const result = await service.register({ name: 'Admin User', email: 'admin@wocs.com', password: 'admin123', role: 'IT_ADMINISTRATOR' });

            expect(result.email).toBe('admin@wocs.com');
            expect(bcrypt.hash).toHaveBeenCalledWith('admin123', 10);
        });

        it('should throw ConflictException when email is already in use', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);

            await expect(
                service.register({ name: 'Dup', email: 'admin@wocs.com', password: 'pass', role: 'FINANCE' }),
            ).rejects.toThrow(ConflictException);
        });

        it('should throw BadRequestException when name is missing', async () => {
            await expect(
                service.register({ name: '', email: 'a@b.com', password: 'p', role: 'FINANCE' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when email is missing', async () => {
            await expect(
                service.register({ name: 'Name', email: '', password: 'p', role: 'FINANCE' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when password is missing', async () => {
            await expect(
                service.register({ name: 'Name', email: 'a@b.com', password: '', role: 'FINANCE' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should default role to CLIENT_USER when not provided', async () => {
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({ ...mockUser, role: 'CLIENT_USER' });

            const result = await service.register({ name: 'Test', email: 'test@t.com', password: 'pass' } as any);

            expect(prisma.user.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ role: 'CLIENT_USER' }) }),
            );
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  login()
    // ═══════════════════════════════════════════════════════════════

    describe('login()', () => {
        it('should return a JWT token on valid credentials', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.login({ email: 'admin@wocs.com', password: 'admin123' });

            expect(result.token).toBe('mock.jwt.token');
            expect(result.user.email).toBe('admin@wocs.com');
            expect(jwt.signAsync).toHaveBeenCalledWith(
                expect.objectContaining({ sub: USER_ID, email: 'admin@wocs.com', role: 'IT_ADMINISTRATOR' }),
            );
        });

        it('should include clientId in JWT payload for CLIENT_USER', async () => {
            const clientUser = { ...mockUser, role: 'CLIENT_USER', clientId: 'cl-001' };
            prisma.user.findUnique.mockResolvedValue(clientUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await service.login({ email: 'client@wocs.com', password: 'pass' });

            expect(jwt.signAsync).toHaveBeenCalledWith(
                expect.objectContaining({ clientId: 'cl-001' }),
            );
        });

        it('should include customerId in JWT payload for CUSTOMER', async () => {
            const customerUser = { ...mockUser, role: 'CUSTOMER', customerId: 'cu-001' };
            prisma.user.findUnique.mockResolvedValue(customerUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await service.login({ email: 'cust@wocs.com', password: 'pass' });

            expect(jwt.signAsync).toHaveBeenCalledWith(
                expect.objectContaining({ customerId: 'cu-001' }),
            );
        });

        it('should throw UnauthorizedException for wrong password', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login({ email: 'admin@wocs.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.login({ email: 'ghost@wocs.com', password: 'pass' })).rejects.toThrow(UnauthorizedException);
        });

        it('should throw BadRequestException when email is empty', async () => {
            await expect(service.login({ email: '', password: 'pass' })).rejects.toThrow(BadRequestException);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    //  User Management (CRUD by Admin)
    // ═══════════════════════════════════════════════════════════════

    describe('listUsers()', () => {
        it('should return all users', async () => {
            prisma.user.findMany.mockResolvedValue([mockUser]);
            const result = await service.listUsers();
            expect(result).toHaveLength(1);
        });

        it('should filter users by search query', async () => {
            prisma.user.findMany.mockResolvedValue([]);
            await service.listUsers('admin');

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }),
            );
        });
    });

    describe('updateUser()', () => {
        it('should update user details', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: USER_ID });
            prisma.user.update.mockResolvedValue({ ...mockUser, name: 'Updated Name' });

            const result = await service.updateUser(USER_ID, { name: 'Updated Name' } as any);

            expect(result.name).toBe('Updated Name');
        });

        it('should throw NotFoundException for non-existent user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(service.updateUser('bad', {} as any)).rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteUser()', () => {
        it('should delete a user', async () => {
            prisma.user.delete.mockResolvedValue({});
            const result = await service.deleteUser(USER_ID);
            expect(result).toEqual({ ok: true });
        });

        it('should throw BadRequestException when id is empty', async () => {
            await expect(service.deleteUser('')).rejects.toThrow(BadRequestException);
        });
    });
});
