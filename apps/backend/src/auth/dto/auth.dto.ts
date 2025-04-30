import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsArray,
  IsOptional,
  IsObject,
} from 'class-validator';

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

  @IsOptional()
  @IsObject()
  metadata?: {
    discordUsername?: string;
    telegramUsername?: string;
    email?: string;
  };
}

export class StarknetAuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    walletAddress: string;
    username?: string;
    email?: string;
    discordId?: string;
    telegramId?: string;
    metadata?: {
      discordUsername?: string;
      telegramUsername?: string;
    };
  };

  constructor(partial: Partial<StarknetAuthResponseDto>) {
    Object.assign(this, partial);
  }
}

export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    walletAddress: string;
    username?: string;
  };
}
