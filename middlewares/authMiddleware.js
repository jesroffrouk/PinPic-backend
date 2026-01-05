import jwt from 'jsonwebtoken';
import catchAsync from '../utils/catchAsync.js';
import customError from '../utils/CustomError.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'AuthMiddleware');

const authMiddleware = {
  requireAuth: catchAsync((req, res, next) => {
    logger.info('auth verify started..');
    const token = req.cookies.token;
    const secretkey = process.env.JWT_SECRET_KEY;
    if (!token) {
      logger.warn('token not provided');
      throw new customError('Token not provided', 401, 'INVALID_TOKEN');
    }
    const { id, username, email } = jwt.verify(token, secretkey);
    logger.info('Token verification successful');
    req.user = { id, username, email };
    next();
  }),
  blockIfAuth: catchAsync((req, res, next) => {
    logger.info('blockIfAuth started..');
    const token = req.cookies.token;
    if (token) {
      logger.warn('restricted route');
      // i am not sending authenticated true so handle that way in frontend
      throw new customError(
        'this is guest route only',
        402,
        'RESTRICTED_ROUTE'
      );
    }
    logger.info('blockIfAuth success');
    next();
  }),
};
export default authMiddleware;
