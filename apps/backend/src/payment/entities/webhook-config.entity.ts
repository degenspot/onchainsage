import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity()
export class WebhookConfig {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  transactionHash: string

  @Column()
  callbackUrl: string

  @Column({ nullable: true })
  secretKey: string

  @Column({
    type: "enum",
    enum: ["PENDING", "DELIVERED", "FAILED", "TIMEOUT"],
    default: "PENDING",
  })
  status: "PENDING" | "DELIVERED" | "FAILED" | "TIMEOUT"

  @Column({ nullable: true })
  deliveredAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
