/**
 * In-memory REST API for the warehouse DataProvider demo.
 * Default port 4010. Run: npm run server:rest
 */
import express from 'express';
import { applyServerFilters } from './server-filter-utils.mjs';

const app = express();
const port = Number.parseInt(process.env.PORT || '4010', 10);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();

    return;
  }

  next();
});

app.use(express.json());

let lines = Array.from({ length: 200 }, (_, i) => ({
  id: `SKU-${1000 + i}`,
  sku: `WIDGET-${String(i + 1).padStart(4, '0')}`,
  bin: `A-${(i % 12) + 1}-${(i % 8) + 1}`,
  quantityOnHand: (i * 17) % 500,
  reorderPoint: 40 + (i % 30),
}));
let seq = lines.length;

/**
 * @param {express.Request['query']} query
 */
function parseSort(query) {
  const sortBy = query.sortBy;
  const dir = query.sortDir === 'desc' ? -1 : 1;

  if (!sortBy) {
    return null;
  }

  return { sortBy, dir };
}

/**
 * @param {express.Request['query']} query
 * @returns {unknown}
 */
function parseFiltersJson(query) {
  const raw = query.filters;

  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

app.get('/api/stock-lines', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize, 10) || 10);
  const sort = parseSort(req.query);
  const filters = parseFiltersJson(req.query);
  let data = applyServerFilters([...lines], filters);

  if (sort) {
    data.sort((a, b) => {
      const av = a[sort.sortBy];
      const bv = b[sort.sortBy];
      let cmp = av < bv ? -1 : av > bv ? 1 : 0;

      if (cmp === 0) {
        cmp = a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      }

      return cmp * sort.dir;
    });
  }

  const start = (page - 1) * pageSize;

  res.json({
    data: data.slice(start, start + pageSize),
    total: data.length,
  });
});

app.post('/api/stock-lines', (req, res) => {
  const body = req.body || {};
  const count = Math.max(1, parseInt(body.count, 10) || 1);
  const position = body.position === 'above' ? 'above' : 'below';
  const referenceRowId = body.referenceRowId;

  const newRows = [];

  for (let i = 0; i < count; i += 1) {
    seq += 1;
    newRows.push({
      id: `SKU-${1000 + seq}`,
      sku: `NEW-${seq}`,
      bin: 'STAGING-1',
      quantityOnHand: 0,
      reorderPoint: 50,
    });
  }

  if (referenceRowId === undefined || referenceRowId === null || referenceRowId === '') {
    lines.push(...newRows);
  } else {
    const refKey = String(referenceRowId);
    const idx = lines.findIndex((r) => String(r.id) === refKey);

    if (idx === -1) {
      lines.push(...newRows);
    } else {
      const insertAt = position === 'above' ? idx : idx + 1;

      lines.splice(insertAt, 0, ...newRows);
    }
  }

  res.status(201).end();
});

app.patch('/api/stock-lines', (req, res) => {
  const { updates } = req.body || {};

  (updates || []).forEach(({ id, changes }) => {
    const row = lines.find((r) => String(r.id) === String(id));

    if (!row || !changes || typeof changes !== 'object') {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(changes, 'sku')) {
      row.sku = changes.sku;
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'bin')) {
      row.bin = changes.bin;
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'quantityOnHand')) {
      const n = Number(changes.quantityOnHand);

      if (Number.isFinite(n)) {
        row.quantityOnHand = n;
      }
    }
    if (Object.prototype.hasOwnProperty.call(changes, 'reorderPoint')) {
      const n = Number(changes.reorderPoint);

      if (Number.isFinite(n)) {
        row.reorderPoint = n;
      }
    }
  });

  res.status(204).end();
});

app.delete('/api/stock-lines', (req, res) => {
  const { ids } = req.body || {};
  const remove = new Set((ids || []).map((id) => String(id)));

  lines = lines.filter((r) => !remove.has(String(r.id)));
  res.status(204).end();
});

app.listen(port, () => {
  console.log(`Warehouse REST API listening on http://localhost:${port}`);
});
