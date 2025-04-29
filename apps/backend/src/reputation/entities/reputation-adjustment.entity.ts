import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class ReputationAdjustment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column({ type: 'numeric' })
  adjustment: number;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  timestamp: Date;
}
