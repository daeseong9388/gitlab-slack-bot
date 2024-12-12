import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Configure body parser
  app.use(json({ limit: '10mb' }));

  // Add global middleware to log all requests
  app.use((req: any, res: any, next: any) => {
    logger.log(`${req.method} ${req.originalUrl}`);
    logger.log('Headers:', JSON.stringify(req.headers, null, 2));
    logger.log('Body:', JSON.stringify(req.body, null, 2));
    next();
  });

  await app.listen('8080');
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
