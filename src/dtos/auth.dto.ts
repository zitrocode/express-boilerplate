// src/dtos/auth.dto.ts
export interface RegisterUserDto {
  name: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordQuery {
  token: string;
}

export interface ResetPasswordDto {
  password: string;
}

export interface VerifyEmailQuery {
  token: string;
}
