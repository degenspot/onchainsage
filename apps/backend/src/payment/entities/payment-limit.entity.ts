import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity()
export class PaymentLimit {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  walletAddress: string

  @Column("decimal", { precision: 20, scale: 8 })
  dailyLimit: number

  @Column("decimal", { precision: 20, scale: 8 })
  transactionMaximum: number

  @Column({ default: 0 })
  riskScore: number

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
