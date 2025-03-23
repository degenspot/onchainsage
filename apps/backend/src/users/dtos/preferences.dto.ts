import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class PreferencesDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsBoolean()
  notifications?: boolean;

  // Allow additional properties with type safety
  [key: string]: any;
}