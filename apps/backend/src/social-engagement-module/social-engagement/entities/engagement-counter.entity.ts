// src/social-engagement/entities/engagement-counter.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, Index, UpdateDateColumn } from 'typeorm';
import { ContentType } from '../../shared/enums/content-type.enum';

@Entity('engagement_counters')
@Index(['contentId', 'contentType'], { unique: true })
export class EngagementCounter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  contentId: string;

  @Column({
    type: 'enum',
    enum: ContentType,
  })
  contentType: ContentType;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  dislikesCount: number;

  @UpdateDateColumn()
  updatedAt: Date;
}