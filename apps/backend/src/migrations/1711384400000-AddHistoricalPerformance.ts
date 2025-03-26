import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHistoricalPerformance1711384400000 implements MigrationInterface {
    name = 'AddHistoricalPerformance1711384400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "signals" 
            ADD COLUMN "confidence_level" varchar(50),
            ADD COLUMN "historical_performance" jsonb,
            ADD COLUMN "is_verified" boolean DEFAULT false
        `);

        // Set default values for existing records
        await queryRunner.query(`
            UPDATE "signals"
            SET confidence_level = 'medium',
                is_verified = false,
                historical_performance = '{"success_rate": 0, "total_signals": 0, "successful_signals": 0, "failed_signals": 0, "average_return": 0, "last_updated": null}'::jsonb
            WHERE confidence_level IS NULL
        `);

        // Make confidence_level NOT NULL after setting defaults
        await queryRunner.query(`
            ALTER TABLE "signals"
            ALTER COLUMN "confidence_level" SET NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "signals"
            DROP COLUMN "historical_performance",
            DROP COLUMN "confidence_level",
            DROP COLUMN "is_verified"
        `);
    }
}
