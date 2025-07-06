import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ForumReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: string;

  @Column()
  reason: string;

  @Column({
    default: false,
  })
  resolved: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
