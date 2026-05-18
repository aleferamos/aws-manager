import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { I18nService } from './shared/i18n/i18n.service';
import { createValidationExceptionFactory } from './shared/validation/validation-exception.factory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:4200')
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  const i18n = app.get(I18nService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: createValidationExceptionFactory(i18n),
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
