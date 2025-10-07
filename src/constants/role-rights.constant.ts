import ROLES from '@/enums/role.enum';
import PERMISSIONS from '@/enums/permission.enum';

const ROLE_RIGHTS: Record<(typeof ROLES)[keyof typeof ROLES], PERMISSIONS[]> = {
  [ROLES.ADMIN]: [PERMISSIONS.MANAGE_USERS],
  [ROLES.MODERATOR]: [PERMISSIONS.READ_USERS, PERMISSIONS.UPDATE_USERS],
  [ROLES.EDITOR]: [],
  [ROLES.USER]: []
};

export default ROLE_RIGHTS;
