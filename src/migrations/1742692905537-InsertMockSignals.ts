// src/migrations/InsertMockSignals.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertMockSignals1610000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO signals (signal_type, value, status, timestamp)
      SELECT 
        'BUY', 
        round(random() * 100, 2), 
        'active', 
        NOW() - (interval '1 minute' * generate_series(1, 100))
      FROM generate_series(1, 100);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove mock data if rolling back the migration
    await queryRunner.query(`
      DELETE FROM signals
      WHERE signal_type = 'BUY' AND status = 'active';
    `);
  }
}
