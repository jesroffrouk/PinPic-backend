import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'globalErrorHandler');

function globalErrorHandler(err, _req, res, _next) {
  logger.error(`unexpected error caught: ${err.stack}`);
  res.status(err.statusCode || 500).json({
    success: false,
    code: err.errorCode || err.name || 'SERVER_ERROR',
    message: err.message || 'something went wrong',
  });
}

export default globalErrorHandler;
