import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file'; // Import DailyRotateFile explicitly

// Configure Winston logge
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      // Use DailyRotateFile directly
      filename: 'logs/api-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',
    }),
  ],
});

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, url, body } = req;

    res.on('finish', () => {
      logger.info({
        level: 'info',
        message: `${method} ${url}`,
        timestamp: new Date().toISOString(),
        statusCode: res.statusCode,
        body,
      });
    });

    next();
  }
}
