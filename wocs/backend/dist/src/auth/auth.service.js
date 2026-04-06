"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    jwtService;
    prisma;
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    sanitizeUser(user) {
        return { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl ?? undefined, clientId: user.clientId ?? undefined };
    }
    async register(createAuthDto) {
        const name = createAuthDto?.name?.trim();
        const email = createAuthDto?.email?.trim().toLowerCase();
        const password = createAuthDto?.password;
        const role = createAuthDto?.role?.trim() || 'CLIENT_USER';
        if (!name || !email || !password) {
            throw new common_1.BadRequestException('name, email and password are required');
        }
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing)
            throw new common_1.ConflictException('email already in use');
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: { name, email, password: passwordHash, role },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, clientId: true },
        });
        return this.sanitizeUser(user);
    }
    async login(loginDto) {
        const email = loginDto?.email?.trim().toLowerCase();
        const password = loginDto?.password;
        if (!email || !password)
            throw new common_1.BadRequestException('email and password are required');
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, password: true, clientId: true },
        });
        if (!user?.password)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(password, user.password);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const token = await this.jwtService.signAsync({ sub: user.id, email: user.email, role: user.role, clientId: user.clientId ?? undefined });
        return {
            token,
            user: this.sanitizeUser(user),
        };
    }
    async me(user) {
        return this.sanitizeUser(user);
    }
    async listUsers(q) {
        const query = q?.trim();
        const users = await this.prisma.user.findMany({
            where: query
                ? {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                        { role: { contains: query, mode: 'insensitive' } },
                    ],
                }
                : undefined,
            orderBy: { name: 'asc' },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, clientId: true },
        });
        return users.map((u) => this.sanitizeUser(u));
    }
    async createUser(createAuthDto) {
        return this.register(createAuthDto);
    }
    async updateUser(userId, updateDto) {
        if (!userId)
            throw new common_1.BadRequestException('id is required');
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('user not found');
        const data = {};
        if (updateDto.name !== undefined)
            data.name = updateDto.name.trim();
        if (updateDto.email !== undefined)
            data.email = updateDto.email.trim().toLowerCase();
        if (updateDto.role !== undefined)
            data.role = updateDto.role.trim();
        const user = await this.prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, clientId: true },
        });
        return this.sanitizeUser(user);
    }
    async deleteUser(userId) {
        if (!userId)
            throw new common_1.BadRequestException('id is required');
        await this.prisma.user.delete({ where: { id: userId } });
        return { ok: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map