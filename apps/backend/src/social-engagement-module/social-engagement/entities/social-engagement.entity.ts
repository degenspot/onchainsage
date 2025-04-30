// src/social-engagement/entities/social-engagement.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EngagementType } from '../../shared/enums/engagement-type.enum';
import { ContentType } from '../../shared/enums/content-type.enum';

@Entity('social_engagements')
@Index(['userId', 'contentId', 'contentType'], { unique: true })
export class SocialEngagement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  contentId: string;

  @Column({
    type: 'enum',
    enum: ContentType,
  })
  contentType: ContentType;

  @Column({
    type: 'enum',
    enum: EngagementType,
  })
  type: EngagementType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Additional metadata can be stored as JSON
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
