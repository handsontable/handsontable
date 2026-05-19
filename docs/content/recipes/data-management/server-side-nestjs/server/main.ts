import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

/**
 * AppModule declares the tickets feature inline for brevity.
 *
 * In a real application, split this into a dedicated TicketsModule:
 *
 *   @Module({ controllers: [TicketsController], providers: [TicketsService] })
 *   export class TicketsModule {}
 *
 *   @Module({ imports: [TicketsModule] })
 *   export class AppModule {}
 */
@Module({
  controllers: [TicketsController],
  providers: [TicketsService],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * Enable CORS so the browser can call the API from a different origin.
   *
   * In production, replace the wildcard with your frontend domain:
   *   app.enableCors({ origin: 'https://your-app.example.com' });
   */
  app.enableCors();

  /**
   * GlobalValidationPipe does two things for every incoming request:
   *
   * 1. transform: true  -- converts query-string values (always strings) to
   *    the types declared in the DTO (e.g. page: '2' -> page: 2).
   *    Powered by class-transformer under the hood.
   *
   * 2. whitelist: true  -- strips any properties that are not declared in the
   *    DTO class, preventing unexpected data from reaching the service.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  );

  await app.listen(3000);
  console.log('NestJS server running on http://localhost:3000');
}

bootstrap();
