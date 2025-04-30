/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Thread } from './thread.entity';
import { Reply } from './reply.entity';
import { Report } from './report.entity';
import { Reaction } from './reaction.entity';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Thread, thread => thread.posts, { onDelete: 'CASCADE' })
  thread: Thread;

  @ManyToOne(() => User)
  author: User;

  @Column('text')
  content: string;

  @Column('float', { default: 0 })
  spamScore: number;

  @Column({ default: false })
  hidden: boolean;

  @OneToMany(() => Reply, reply => reply.post, { cascade: true })
  replies: Reply[];

  @OneToMany(() => Report, report => report.post, { cascade: true })
  reports: Report[];

  @OneToMany(() => Reaction, reaction => reaction.post, { cascade: true })
  reactions: Reaction[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
