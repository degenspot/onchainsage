import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { Exclude } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  accessToken: string;

  @Exclude()
  user: {
    id: number;
    username: string;
  };

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
