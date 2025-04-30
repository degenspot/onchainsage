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

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  walletAddress: string;

  @Column({ nullable: true })
  username: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  nonce: string;

  @Column({ nullable: true })
  signature: string;

  
  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 10, default: UserRole.USER })
  role: UserRole;
}
