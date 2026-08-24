import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source';
import { ticketsRouter } from './tickets.router';

const app = express();
const PORT = 3000;

/**
 * Enable CORS so the browser can call the API from a different origin.
 *
 * In production, replace the wildcard with your frontend domain:
 *   app.use(cors({ origin: 'https://your-app.example.com' }));
 */
app.use(cors());

/**
 * Parse incoming JSON request bodies.
 * Required for POST, PATCH, and DELETE endpoints that receive JSON payloads.
 */
app.use(express.json());

app.use('/tickets', ticketsRouter);

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Express server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
    process.exit(1);
  });
