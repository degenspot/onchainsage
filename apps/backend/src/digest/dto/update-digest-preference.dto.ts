import { IsEnum, IsOptional, IsUrl, ValidateIf } from 'class-validator';
import { DigestFrequency, DigestDeliveryMethod } from '../entities/user-digest-preference.entity';

export class UpdateDigestPreferenceDto {
  @IsEnum(DigestFrequency)
  frequency: DigestFrequency;

  @IsEnum(DigestDeliveryMethod)
  deliveryMethod: DigestDeliveryMethod;

  @ValidateIf(o => o.deliveryMethod === DigestDeliveryMethod.WEBHOOK || o.deliveryMethod === DigestDeliveryMethod.BOTH)
  @IsUrl()
  webhookUrl?: string;
}