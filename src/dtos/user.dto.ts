import ROLES from '@/enums/role.enum';

export interface CreateUserDto {
  name: string;
  lastName: string;
  email: string;
  password: string;
  role?: ROLES;
}

export interface GetUsersQueryDto {
  name?: string;
  role?: ROLES;
  sort?: string;
  limit?: number;
  page?: number;
}

export interface GetUserParamsDto {
  userId: string;
}

export interface UpdateUserParamsDto {
  userId: string;
}

export interface UpdateUserBodyDto {
  name?: string;
  email?: string;
  password?: string;
}

export interface DeleteUserParamsDto {
  userId: string;
}
