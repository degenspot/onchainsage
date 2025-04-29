import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

@Entity("daily_analytics")
export class DailyAnalytics {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "date" })
  @Index({ unique: true })
  date: Date

  @Column({ type: "integer", default: 0 })
  newSignals: number

  @Column({ type: "integer", default: 0 })
  newVotes: number

  @Column({ type: "integer", default: 0 })
  activeUsers: number

  @Column({ type: "decimal", precision: 36, scale: 18, default: 0 })
  amountStaked: string

  @Column({ type: "decimal", precision: 36, scale: 18, default: 0 })
  amountUnstaked: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
