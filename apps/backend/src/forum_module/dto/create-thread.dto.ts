import { IsString, IsNotEmpty } from 'class-validator';

export class CreateThreadDto {
  @IsString()
  @IsNotEmpty()
  signalId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
