import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class AdminJwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = AuthenticatedUser>(
    err: Error | null,
    user: TUser | false,
  ): TUser {
    if (err || !user) {
      throw err ?? new ForbiddenException('Admin authentication required');
    }

    const admin = user as unknown as AuthenticatedUser;
    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin role required');
    }

    return user;
  }
}
