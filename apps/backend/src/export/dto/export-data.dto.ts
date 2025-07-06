import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
}

export class ExportDataDto {
  @ApiProperty({ enum: ExportFormat, default: ExportFormat.CSV })
  @IsEnum(ExportFormat)
  @IsOptional()
  format: ExportFormat = ExportFormat.CSV;
}
