/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Post } from './post.entity';
import { Report } from './report.entity';
import { Reaction } from './reaction.entity';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Reply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, post => post.replies, { onDelete: 'CASCADE' })
  post: Post;

  @ManyToOne(() => User)
  author: User;

  @Column('text')
  content: string;

  @Column('float', { default: 0 })
  spamScore: number;

  @Column({ default: false })
  hidden: boolean;

  @OneToMany(() => Report, report => report.reply, { cascade: true })
  reports: Report[];

  @OneToMany(() => Reaction, reaction => reaction.reply, { cascade: true })
  reactions: Reaction[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
