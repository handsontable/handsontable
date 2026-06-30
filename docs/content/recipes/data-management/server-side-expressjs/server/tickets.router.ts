import { Router, Request, Response } from 'express';
import { TicketsService, FetchTicketsParams } from './tickets.service';
import { fetchQuerySchema } from './types';

const service = new TicketsService();
export const ticketsRouter = Router();

/**
 * GET /tickets?page=1&pageSize=5&sort[column]=status&sort[order]=asc
 *   &filters[0][prop]=status&filters[0][condition]=eq&filters[0][value][0]=open
 *
 * Zod's safeParse coerces string query-param values to numbers and validates
 * the shape before the request reaches the service.
 */
ticketsRouter.get('/', async (req: Request, res: Response) => {
  const parsed = fetchQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten() });
    return;
  }

  try {
    const result = await service.findAll(parsed.data as FetchTicketsParams);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /tickets
 * Body: single CreateTicketDto or array of CreateTicketDto
 *
 * Handsontable's onRowsCreate callback sends one object per new row.
 * Wrapping a single object in an array normalises the input for the service.
 */
ticketsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const rows = Array.isArray(body) ? body : [body];
    const result = await Promise.all(rows.map((dto) => service.create(dto)));
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /tickets
 * Body: [{ id: 'uuid', status: 'resolved' }, ...]
 *
 * Each entry contains the row id plus only the changed columns.
 */
ticketsRouter.patch('/', async (req: Request, res: Response) => {
  try {
    const result = await service.updateMany(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /tickets
 * Body: ['uuid1', 'uuid2', ...]
 *
 * Handsontable passes an array of row ID strings matching dataProvider.rowId.
 */
ticketsRouter.delete('/', async (req: Request, res: Response) => {
  try {
    await service.removeMany(req.body);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
