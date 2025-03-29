import { IsEnum, IsBoolean, IsArray } from 'class-validator';

export enum NotificationChannel {
  EMAIL = 'email',
  WEBSOCKET = 'websocket'
}

export enum SignalType {
  HIGH_CONFIDENCE = 'high_confidence',
  MARKET_CHANGE = 'market_change',
  TREND_ALERT = 'trend_alert'
}

export class UpdateNotificationPreferencesDto {
  @IsArray()
  @IsEnum(SignalType, { each: true })
  enabledSignalTypes: SignalType[];

  @IsEnum(NotificationChannel, { each: true })
  preferredChannels: NotificationChannel[];

  @IsBoolean()
  isEnabled: boolean;
}

