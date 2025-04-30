/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Post } from './post.entity';
import { Reply } from './reply.entity';
import { User } from 'src/users/entities/user.entity';

export enum ReactionType {
  LIKE = 'like',
  DISLIKE = 'dislike',
}

@Entity()
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, post => post.reactions, { nullable: true, onDelete: 'CASCADE' })
  post: Post;

  @ManyToOne(() => Reply, reply => reply.reactions, { nullable: true, onDelete: 'CASCADE' })
  reply: Reply;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'enum', enum: ReactionType })
  type: ReactionType;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
