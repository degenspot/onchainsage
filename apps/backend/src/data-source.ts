import { DataSource } from 'typeorm';
import { Signal } from './entities/signal.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'onchainsage',
  synchronize: false,
  logging: true,
  entities: [Signal],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
