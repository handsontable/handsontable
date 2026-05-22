import { DataSource } from 'typeorm';
import { TicketEntity } from './ticket.entity';

// Not included in the PR - inferred from main.ts and tickets.service.ts usage.
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'tickets',
  entities: [TicketEntity],
  // Creates / updates the schema on startup. Fine for testing; use migrations in prod.
  synchronize: true,
  logging: false,
});
