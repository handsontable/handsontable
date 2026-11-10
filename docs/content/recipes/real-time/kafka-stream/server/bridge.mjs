import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { kafka, ensureTopics, SETTINGS_TOPIC, STOCK_TOPIC } from './kafka.mjs';

const PORT = Number(process.env.PORT ?? 3001);
const FLUSH_MS = 50;
const HEARTBEAT_MS = 15_000;
const DEFAULT_REORDER_POINT = 50;

// The materialized view: the latest stock record and settings for every SKU.
const stock = new Map();
const settings = new Map();
// SKUs changed since the last flush. Several changes to one SKU collapse into one.
const changed = new Set();
const clients = new Set();

// settingsRevision is the Kafka offset of the SKU's latest settings record (-1 for none).
// One key always lands in one partition, so a higher offset means a later edit, and a grid
// can tell that its own edit was applied even when a later edit replaced the value.
function toRow(sku) {
  const record = stock.get(sku);
  const setting = settings.get(sku);

  return record && {
    ...record,
    reorderPoint: setting?.reorderPoint ?? DEFAULT_REORDER_POINT,
    settingsRevision: setting?.revision ?? -1,
  };
}

function send(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Sends the changes of the last FLUSH_MS as one event, instead of one event per record.
setInterval(() => {
  if (changed.size === 0 || clients.size === 0) {
    changed.clear();

    return;
  }

  const upserts = [];
  const deletes = [];

  for (const sku of changed) {
    const row = toRow(sku);

    if (row) {
      upserts.push(row);
    } else {
      deletes.push(sku);
    }
  }

  changed.clear();

  for (const res of clients) {
    send(res, 'changes', { upserts, deletes });
  }
}, FLUSH_MS);

await ensureTopics();

// Every start reads both topics from the beginning and rebuilds the view; compaction keeps
// that replay short. A new group per process gets its partitions at once: with a fixed
// group, a restarted bridge waits until Kafka times out the stopped one. The group never
// commits offsets, so Kafka removes it once it is empty.
const consumer = kafka.consumer({
  kafkaJS: { groupId: `inventory-grid-bridge-${randomUUID()}`, fromBeginning: true, autoCommit: false },
});

await consumer.connect();
await consumer.subscribe({ topics: [STOCK_TOPIC, SETTINGS_TOPIC] });
await consumer.run({
  eachMessage: async ({ topic, message }) => {
    const sku = message.key.toString();
    const value = message.value ? JSON.parse(message.value.toString()) : null;
    const target = topic === STOCK_TOPIC ? stock : settings;

    if (value === null) {
      target.delete(sku);
    } else if (topic === SETTINGS_TOPIC) {
      target.set(sku, { ...value, revision: Number(message.offset) });
    } else {
      target.set(sku, value);
    }

    changed.add(sku);
  },
});

const producer = kafka.producer();

await producer.connect();

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // The live stream: a snapshot of every row, then batched changes.
  if (req.method === 'GET' && url.pathname === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    send(res, 'snapshot', { rows: [...stock.keys()].map(toRow) });
    clients.add(res);

    // A regular event, not an SSE comment: the browser can see it, so a client that hears
    // nothing for a while knows the stream is dead, even when a proxy keeps it open.
    const heartbeat = setInterval(() => send(res, 'ping', {}), HEARTBEAT_MS);

    req.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(res);
    });

    return;
  }

  // An edit from the grid. It is written to Kafka, not to the view: the change reaches
  // every open grid, this one included, through the stream.
  const match = url.pathname.match(/^\/api\/settings\/([^/]+)$/);

  if (req.method === 'POST' && match) {
    const sku = decodeURIComponent(match[1]);

    try {
      const { reorderPoint } = await readJson(req);

      if (!stock.has(sku) || !Number.isInteger(reorderPoint) || reorderPoint < 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Unknown SKU or invalid reorder point' }));

        return;
      }

      const [{ baseOffset }] = await producer.send({
        topic: SETTINGS_TOPIC,
        messages: [{ key: sku, value: JSON.stringify({ reorderPoint }) }],
      });

      // The record's offset is its revision: the grid waits for a row at least this new.
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ revision: Number(baseOffset) }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: error.message }));
    }

    return;
  }

  res.writeHead(404).end();
});

server.listen(PORT, () => console.log(`Bridge listening on http://localhost:${PORT}`));

// Leave the consumer group and close connections on Ctrl+C or a stop signal.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    server.close();
    await Promise.allSettled([consumer.disconnect(), producer.disconnect()]);
    process.exit(0);
  });
}
