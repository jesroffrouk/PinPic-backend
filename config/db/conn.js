import { Pool,types } from 'pg';
import 'dotenv/config';
import { createLoggerFor } from '../../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'config service');
const connectionString = process.env.POSTGRE_URI;

// force bigint (OID 20) to be parsed as number
types.setTypeParser(20, val => parseInt(val, 10));

const pool = new Pool({
  // user: 'pinpic_postgres_db_user',
  //     host: '',
  //     database: 'pinpic_postgres_db',
  //     password: 'OpoYmExsyUnVOKQcDfI99GRfR5z5EaZc',
  //     port: 5432
  connectionString,
  ssl: false,
});

pool.on('connect', () => {
  logger.info('postgres db connected successfully');
});

pool.on('error', (err) => {
  logger.error(`unexpected db error occured : ${err.message}`);
});

export default pool;
