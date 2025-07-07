import { config } from './env.config';

export const dbConfig = {
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  connectionLimit: config.DB_CONNECTION_LIMIT,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  multipleStatements: false,
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
};