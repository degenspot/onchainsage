import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DigestFrequency {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export enum DigestDeliveryMethod {
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  BOTH = 'both',
}

@Entity('user_digest_preferences')
export class UserDigestPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: DigestFrequency,
    default: DigestFrequency.NONE,
  })
  frequency: DigestFrequency;

  @Column({
    type: 'enum',
    enum: DigestDeliveryMethod,
    default: DigestDeliveryMethod.EMAIL,
  })
  deliveryMethod: DigestDeliveryMethod;

  @Column({ nullable: true })
  webhookUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

