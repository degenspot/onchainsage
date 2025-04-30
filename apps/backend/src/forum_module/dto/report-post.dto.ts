import { IsString, IsNotEmpty } from 'class-validator';

export class ReportPostDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
