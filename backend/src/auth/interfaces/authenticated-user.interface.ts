import { UserRole } from '../../common/enums/user-role.enum';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}
