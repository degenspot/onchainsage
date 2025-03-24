// src/entities/signal.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('signals')
export class Signal {
  @PrimaryGeneratedColumn()
  signal_id: number;

  @Index() // Indexed for faster ordering/search
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 50 })
  signal_type: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'varchar', length: 50 })
  status: string;
}
