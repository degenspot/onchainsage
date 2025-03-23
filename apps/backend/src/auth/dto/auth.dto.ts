import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsArray,
  IsOptional,
} from 'class-validator';
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

// Add new DTOs for Starknet wallet authentication
export class StarknetChallengeDto {
  @IsString()
  walletAddress: string;
}

export class StarknetVerifyDto {
  @IsString()
  walletAddress: string;

  @IsArray()
  signature: string[];

  @IsString()
  message: string;
}

export class StarknetAuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    walletAddress: string;
    username?: string;
  };

  constructor(partial: Partial<StarknetAuthResponseDto>) {
    Object.assign(this, partial);
  }
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
