import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class UserPreferences {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;
}