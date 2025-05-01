import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class ExportHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  type: 'signal' | 'voting' | 'staking';

  @Column({ type: 'json', nullable: true })
  parameters: Record<string, any>;

  @Column()
  format: 'csv' | 'json';

  @CreateDateColumn()
  createdAt: Date;
}
