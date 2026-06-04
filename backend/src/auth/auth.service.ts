import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../database/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface LoginResult {
  accessToken: string;
  expiresIn: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async loginAdmin(email: string, password: string): Promise<LoginResult> {
    return this.login(email, password, UserRole.ADMIN, 'Invalid admin credentials');
  }

  async loginPlayer(email: string, password: string): Promise<LoginResult> {
    return this.login(email, password, UserRole.PLAYER, 'Invalid player credentials');
  }

  private async login(
    email: string,
    password: string,
    expectedRole: UserRole,
    errorMessage: string,
  ): Promise<LoginResult> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || user.role !== expectedRole) {
      throw new UnauthorizedException(errorMessage);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException(errorMessage);
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      expiresIn: '8h',
      role: user.role,
    };
  }
}
