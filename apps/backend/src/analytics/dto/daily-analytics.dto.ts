import { ApiProperty } from "@nestjs/swagger"

export class DailyAnalyticsDto {
  @ApiProperty({ description: "Date for the analytics" })
  date: Date

  @ApiProperty({ description: "Number of new signals created on this date" })
  newSignals: number

  @ApiProperty({ description: "Number of new votes cast on this date" })
  newVotes: number

  @ApiProperty({ description: "Number of active users on this date" })
  activeUsers: number

  @ApiProperty({ description: "Amount staked on this date (in wei)" })
  amountStaked: string

  @ApiProperty({ description: "Amount unstaked on this date (in wei)" })
  amountUnstaked: string
}
