import PERMISSIONS from '@/enums/permission.enum';

export const PERMISSION_MAP: Record<string, string[]> = {
  // Manager users implicitly has all other user permissions
  [PERMISSIONS.MANAGE_USERS]: [
    PERMISSIONS.READ_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.UPDATE_USERS,
    PERMISSIONS.DELETE_USERS
  ]
};

export default PERMISSION_MAP;
