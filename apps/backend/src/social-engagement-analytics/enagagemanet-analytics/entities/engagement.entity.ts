// src/social-engagement-analytics/entities/engagement.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Content } from 'src/content/entities/content.entity';

export enum EngagementType {
  LIKE = 'like',
  DISLIKE = 'dislike',
  COMMENT = 'comment',
  SHARE = 'share',
  VIEW = 'view',
}

@Entity('engagements')
@Index(['type', 'timestamp'])
export class Engagement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Content)
  content: Content;

  @Column()
  contentId: string;

  @Column({
    type: 'enum',
    enum: EngagementType,
  })
  type: EngagementType;

  @Column({ nullable: true, type: 'text' })
  text: string;

  @Column({ default: 1 })
  weight: number;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
