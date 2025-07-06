import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('rate_limit_violations')
export class RateLimitViolation {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'ip_address', nullable: false })
  ipAddress: string;

  @Column({ name: 'wallet_address', nullable: true })
  walletAddress: string | null;

  @Column({ nullable: false })
  endpoint: string;

  @Column({ nullable: false })
  method: string;

  @Column({ type: 'timestamp', nullable: false })
  timestamp: Date;

  @Column({ name: 'violated_rule', type: 'json', nullable: false })
  violatedRule: { limit: number; window: string };
}
