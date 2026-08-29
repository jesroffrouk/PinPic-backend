import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'db service');

const helperRepository = ({ db }) => {
  return {
    getIdFromPublicId: async (table, public_id) => {
      logger.info('getting id');
      return await db.query(
        `Select id 
                     From ${table}
                     WHERE public_id = $1`,
        [public_id]
      );
    },
    getUptimeCheck: async() => {
      logger.info('checking database');
      return await db.query(
        `Select 1`
      );
    },
  };
};

export default helperRepository;
