import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  Moderator = 'moderator',
  Viewer = 'viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-array', nullable: true })
  roles: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ unique: true })
  walletAddress: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isShadowbanned: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastChallengeAt: Date;

  @Column({ nullable: true })
  lastChallenge: string;

  @Column({ nullable: true })
  nonce: string;

  @Column({ nullable: true })
  signature: string;

  @Column({ nullable: true })
  discordId?: string;

  @Column({ nullable: true })
  telegramId?: string;

  @Column({ nullable: true })
  signalAudits?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    discordUsername?: string;
    telegramUsername?: string;
  };

  @Column({ type: 'varchar', length: 10, default: UserRole.USER })
  role: UserRole;
}

export { User as UserEntity };
