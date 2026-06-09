import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketEntity } from './ticket.entity';

/**
 * AppModule wires the TypeORM connection and the tickets feature together.
 *
 * TypeOrmModule.forRoot() creates the database connection.
 * TypeOrmModule.forFeature([TicketEntity]) registers the repository so
 * TicketsService can inject it via @InjectRepository(TicketEntity).
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'tickets',
      password: process.env.DB_PASS || 'tickets',
      database: process.env.DB_NAME || 'tickets',
      entities: [TicketEntity],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([TicketEntity]),
  ],
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
