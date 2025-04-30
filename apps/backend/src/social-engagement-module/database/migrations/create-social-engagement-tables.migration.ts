// src/database/migrations/create-social-engagement-tables.migration.ts
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateSocialEngagementTables1715076125000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ContentType enum
    await queryRunner.query(`
      CREATE TYPE "content_type_enum" AS ENUM (
        'trading_signal', 
        'market_analysis', 
        'community_post', 
        'comment'
      )
    `);

    // Create EngagementType enum
    await queryRunner.query(`
      CREATE TYPE "engagement_type_enum" AS ENUM (
        'like', 
        'dislike'
      )
    `);

    // Create social_engagements table
    await queryRunner.createTable(
      new Table({
        name: 'social_engagements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'contentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'contentType',
            type: 'content_type_enum',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'engagement_type_enum',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create engagement_counters table
    await queryRunner.createTable(
      new Table({
        name: 'engagement_counters',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'contentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'contentType',
            type: 'content_type_enum',
            isNullable: false,
          },
          {
            name: 'likesCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'dislikesCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'social_engagements',
      new TableIndex({
        name: 'IDX_social_engagements_user_content',
        columnNames: ['userId', 'contentId', 'contentType'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'social_engagements',
      new TableIndex({
        name: 'IDX_social_engagements_user',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'social_engagements',
      new TableIndex({
        name: 'IDX_social_engagements_content',
        columnNames: ['contentId', 'contentType'],
      }),
    );

    await queryRunner.createIndex(
      'engagement_counters',
      new TableIndex({
        name: 'IDX_engagement_counters_content',
        columnNames: ['contentId', 'contentType'],
        isUnique: true,
      }),
    );

    // Add foreign key for userId if users table exists
    const usersTableExists = await queryRunner.hasTable('users');
    if (usersTableExists) {
      await queryRunner.createForeignKey(
        'social_engagements',
        new TableForeignKey({
          columnNames: ['userId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const usersTableExists = await queryRunner.hasTable('users');
    if (usersTableExists) {
      const table = await queryRunner.getTable('social_engagements');
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('userId') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('social_engagements', foreignKey);
      }
    }

    // Drop tables
    await queryRunner.dropTable('engagement_counters');
    await queryRunner.dropTable('social_engagements');

    // Drop enums
    await queryRunner.query(`DROP TYPE "engagement_type_enum"`);
    await queryRunner.query(`DROP TYPE "content_type_enum"`);
  }
}
