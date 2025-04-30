import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsPositive,
  Max,
} from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"

export class DepositDto {
  @ApiProperty({
    description: "User wallet address",
    example: "0x0123456789abcdef0123456789abcdef01234567",
  })
  @IsNotEmpty()
  @IsString()
  walletAddress: string

  @ApiProperty({
    description: "Amount to deposit",
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number
}

export class UpgradeDto {
  @ApiProperty({
    description: "User wallet address",
    example: "0x0123456789abcdef0123456789abcdef01234567",
  })
  @IsNotEmpty()
  @IsString()
  walletAddress: string
}

export class PayForCallDto {
  @ApiProperty({
    description: "User wallet address",
    example: "0x0123456789abcdef0123456789abcdef01234567",
  })
  @IsNotEmpty()
  @IsString()
  walletAddress: string

  @ApiProperty({
    description: "Amount to pay for call",
    example: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number
}

export class TransactionStatusDto {
  @ApiProperty({
    description: "Transaction hash",
    example: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  })
  @IsNotEmpty()
  @IsString()
  transactionHash: string
}

export class WebhookConfigDto {
  @ApiProperty({
    description: "Callback URL for transaction receipt",
    example: "https://your-app.com/webhook/transaction",
  })
  @IsNotEmpty()
  @IsString()
  callbackUrl: string

  @ApiProperty({
    description: "Transaction hash to monitor",
    example: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  })
  @IsNotEmpty()
  @IsString()
  transactionHash: string

  @ApiProperty({
    description: "Secret key for webhook authentication",
    example: "your-secret-key",
    required: false,
  })
  @IsOptional()
  @IsString()
  secretKey?: string
}

// New DTOs for enhanced functionality

export class GetBalanceDto {
  @ApiProperty({
    description: "User wallet address",
    example: "0x0123456789abcdef0123456789abcdef01234567",
  })
  @IsNotEmpty()
  @IsString()
  walletAddress: string
}

export class BatchPaymentItemDto {
  @ApiProperty({
    description: "Recipient wallet address",
    example: "0x0123456789abcdef0123456789abcdef01234567",
  })
  @IsNotEmpty()
  @IsString()
  recipientAddress: string

  @ApiProperty({
    description: "Amount to pay",
    example: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number

  @ApiProperty({
    description: "Payment reference or description",
    example: "Payment for service XYZ",
    required: false,
  })
  @IsOptional()
  @IsString()
  reference?: string
}

export class BatchPaymentDto {
  @ApiProperty({
    description: "Sender wallet address",
    example: "0x0123456789abcdef0123456789abcdef01234567",
  })
  @IsNotEmpty()
  @IsString()
  senderAddress: string

  @ApiProperty({
    description: "Array of payment items",
    type: [BatchPaymentItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchPaymentItemDto)
  payments: BatchPaymentItemDto[]
}

export class RefundDto {
  @ApiProperty({
    description: "Original transaction hash to refund",
    example: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  })
  @IsNotEmpty()
  @IsString()
  transactionHash: string

  @ApiProperty({
    description: "Amount to refund (if partial refund)",
    example: 50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number

  @ApiProperty({
    description: "Reason for refund",
    example: "Customer request",
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string
}

export enum PaymentPeriod {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
}

export class SchedulePaymentDto {
  @ApiProperty({
    description: "Sender wallet address",
    example: "0x0123456789abcdef0123456789abcdef01234567",
  })
  @IsNotEmpty()
  @IsString()
  senderAddress: string

  @ApiProperty({
    description: "Recipient wallet address",
    example: "0x0123456789abcdef0123456789abcdef01234567",
  })
  @IsNotEmpty()
  @IsString()
  recipientAddress: string

  @ApiProperty({
    description: "Amount to pay",
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number

  @ApiProperty({
    description: "Scheduled execution date",
    example: "2023-12-31T23:59:59Z",
  })
  @IsNotEmpty()
  @IsDateString()
  scheduledDate: string

  @ApiProperty({
    description: "Whether this is a recurring payment",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  recurring?: boolean

  @ApiProperty({
    description: "Recurrence period (if recurring)",
    enum: PaymentPeriod,
    example: PaymentPeriod.MONTH,
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentPeriod)
  recurrencePeriod?: PaymentPeriod

  @ApiProperty({
    description: "Number of recurrences (if recurring, 0 for indefinite)",
    example: 12,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  recurrenceCount?: number

  @ApiProperty({
    description: "Payment reference or description",
    example: "Monthly subscription",
    required: false,
  })
  @IsOptional()
  @IsString()
  reference?: string
}

export class CancelScheduledPaymentDto {
  @ApiProperty({
    description: "Scheduled payment ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsNotEmpty()
  @IsUUID()
  paymentId: string
}

export class PaymentLimitDto {
  @ApiProperty({
    description: "User wallet address",
    example: "0x0123456789abcdef0123456789abcdef01234567",
  })
  @IsNotEmpty()
  @IsString()
  walletAddress: string

  @ApiProperty({
    description: "Daily transaction limit amount",
    example: 1000,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  dailyLimit: number

  @ApiProperty({
    description: "Single transaction maximum amount",
    example: 500,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  transactionMaximum: number

  @ApiProperty({
    description: "Risk score (0-100, higher means more restrictions)",
    example: 20,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore: number
}

export class PaymentHistoryQueryDto {
  @ApiProperty({
    description: "User wallet address",
    example: "0x0123456789abcdef0123456789abcdef01234567",
  })
  @IsNotEmpty()
  @IsString()
  walletAddress: string

  @ApiProperty({
    description: "Start date for filtering (ISO format)",
    example: "2023-01-01T00:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiProperty({
    description: "End date for filtering (ISO format)",
    example: "2023-12-31T23:59:59Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string

  @ApiProperty({
    description: "Page number for pagination",
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1

  @ApiProperty({
    description: "Items per page for pagination",
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10
}

export class PaymentAnalyticsQueryDto {
  @ApiProperty({
    description: "User wallet address",
    example: "0x0123456789abcdef0123456789abcdef01234567",
  })
  @IsNotEmpty()
  @IsString()
  walletAddress: string

  @ApiProperty({
    description: "Start date for analytics period (ISO format)",
    example: "2023-01-01T00:00:00Z",
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string

  @ApiProperty({
    description: "End date for analytics period (ISO format)",
    example: "2023-12-31T23:59:59Z",
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string

  @ApiProperty({
    description: "Group by period (day, week, month)",
    enum: ["day", "week", "month"],
    example: "month",
    default: "month",
    required: false,
  })
  @IsOptional()
  @IsEnum(["day", "week", "month"])
  groupBy?: "day" | "week" | "month" = "month"
}
