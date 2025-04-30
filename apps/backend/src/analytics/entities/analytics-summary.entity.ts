import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("analytics_summary")
export class AnalyticsSummary {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "integer", default: 0 })
  totalUsers: number

  @Column({ type: "integer", default: 0 })
  totalSignals: number

  @Column({ type: "integer", default: 0 })
  totalVotes: number

  @Column({ type: "decimal", precision: 36, scale: 18, default: 0 })
  totalStaked: string

  @Column({ type: "timestamp", nullable: true })
  lastUpdated: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
