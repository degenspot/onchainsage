import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSentimentScoreToTweets090420251350 implements MigrationInterface {
    name = 'AddSentimentScoreToTweets090420251350'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tweets"
            ADD COLUMN "sentiment_score" float
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tweets"
            DROP COLUMN "sentiment_score"
        `);
    }
}
