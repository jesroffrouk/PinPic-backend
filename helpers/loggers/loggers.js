import winston from 'winston';
// import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path';

const { timestamp, label, printf, combine, json } = winston.format;
const transports = [new winston.transports.Console()];

// const transport = new DailyRotateFile({
//     filename: 'logs/app-%DATE%.log',
//     datePattern: 'YYYY-MM-DD',
//     zippedArchive: true,
//     maxSize: '20m',
//     maxFiles: '14d'
// })

// if ( process.env.NODE_ENV == 'production') {
//     transports.push(transport)
// }

export function createLoggerFor(filePath, serviceName) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      label({ label: path.basename(filePath) }),
      timestamp(),
      process.env.NODE_ENV == 'production'
        ? json()
        : printf(
            ({ timestamp, level, message, label }) =>
              `${timestamp} [${serviceName}] [${label}] [${level}]: ${message}`
          )
    ),
    defaultMeta: { service: serviceName },
    transports,
  });
}
