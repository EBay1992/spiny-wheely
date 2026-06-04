import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class PlayerJwtGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser>(
    err: Error | null,
    user: TUser | false,
  ): TUser {
    if (err || !user) {
      throw err ?? new ForbiddenException('Player authentication required');
    }

    const player = user as unknown as AuthenticatedUser;
    if (player.role !== UserRole.PLAYER) {
      throw new ForbiddenException('Player role required');
    }

    return user;
  }
}
