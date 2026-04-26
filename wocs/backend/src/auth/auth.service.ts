import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) { }

  private sanitizeUser(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    clientId?: string | null;
    customerId?: string | null;
  }) {
    return { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl ?? undefined, clientId: user.clientId ?? undefined, customerId: user.customerId ?? undefined };
  }

  async register(createAuthDto: CreateAuthDto) {
    const name = createAuthDto?.name?.trim();
    const email = createAuthDto?.email?.trim().toLowerCase();
    const password = createAuthDto?.password;
    const role = createAuthDto?.role?.trim() || 'CLIENT_USER';

    if (!name || !email || !password) {
      throw new BadRequestException('name, email and password are required');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('email already in use');

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { name, email, password: passwordHash, role },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, clientId: true, customerId: true },
    });

    return this.sanitizeUser(user);
  }

  async login(loginDto: LoginAuthDto) {
    const email = loginDto?.email?.trim().toLowerCase();
    const password = loginDto?.password;

    if (!email || !password) throw new BadRequestException('email and password are required');

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, password: true, clientId: true, customerId: true },
    });

    if (!user?.password) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = await this.jwtService.signAsync({ sub: user.id, email: user.email, role: user.role, clientId: user.clientId ?? undefined, customerId: user.customerId ?? undefined });

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  async me(user: any) {
    // JwtStrategy.validate() returns a subset already, so just re-sanitize.
    return this.sanitizeUser(user);
  }

  async listUsers(q?: string) {
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
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, clientId: true, customerId: true },
    });

    return users.map((u) => this.sanitizeUser(u));
  }

  async createUser(createAuthDto: CreateAuthDto) {
    // Same behavior as register, but kept separate for future role guards.
    return this.register(createAuthDto);
  }

  async updateUser(userId: string, updateDto: UpdateAuthDto) {
    if (!userId) throw new BadRequestException('id is required');

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('user not found');

    const data: any = {};
    if (updateDto.name !== undefined) data.name = updateDto.name.trim();
    if (updateDto.email !== undefined) data.email = updateDto.email.trim().toLowerCase();
    if (updateDto.role !== undefined) data.role = updateDto.role.trim();

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, clientId: true, customerId: true },
    });

    return this.sanitizeUser(user);
  }

  async deleteUser(userId: string) {
    if (!userId) throw new BadRequestException('id is required');

    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }
}
