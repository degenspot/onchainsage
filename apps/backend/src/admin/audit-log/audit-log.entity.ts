import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string;

  @Column()
  performedBy: string; // wallet or user ID

  @Column()
  targetId: string;

  @Column('text')
  details: string;

  @CreateDateColumn()
  timestamp: Date;
}
