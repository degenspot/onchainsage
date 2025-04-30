/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Post } from './post.entity';
import { Reply } from './reply.entity';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, post => post.reports, { nullable: true, onDelete: 'CASCADE' })
  post: Post;

  @ManyToOne(() => Reply, reply => reply.reports, { nullable: true, onDelete: 'CASCADE' })
  reply: Reply;

  @ManyToOne(() => User)
  reporter: User;

  @Column('text')
  reason: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
