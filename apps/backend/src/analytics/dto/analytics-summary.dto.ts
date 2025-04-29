import { ApiProperty } from "@nestjs/swagger"

export class AnalyticsSummaryDto {
  @ApiProperty({ description: "Total number of unique users" })
  totalUsers: number

  @ApiProperty({ description: "Total number of signals" })
  totalSignals: number

  @ApiProperty({ description: "Total number of votes" })
  totalVotes: number

  @ApiProperty({ description: "Total amount staked (in wei)" })
  totalStaked: string

  @ApiProperty({ description: "Last time the summary was updated" })
  lastUpdated: Date
}
