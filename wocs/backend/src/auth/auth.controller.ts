import { Body, Controller, Delete, Get, Patch, Post, Query, Req, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginAuthDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.authService.me(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  listUsers(@Query('q') q?: string) {
    return this.authService.listUsers(q);
  }

  @UseGuards(JwtAuthGuard)
  @Post('users')
  createManagedUser(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.createUser(createAuthDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() updateAuthDto: UpdateAuthDto,
  ) {
    return this.authService.updateUser(id, updateAuthDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
