import { kafka, ensureTopics, STOCK_TOPIC } from './kafka.mjs';

// Simulates a warehouse system: stock movements for 500 SKUs in 4 warehouses.
const RATE = Number(process.env.RATE ?? 200); // records per second
const TICK_MS = 50;
const WAREHOUSES = ['Berlin', 'Chicago', 'Singapore', 'Sao Paulo'];
const PRODUCTS = ['Laptop', 'Monitor', 'Dock', 'Keyboard', 'Headset', 'Webcam', 'Switch', 'Router', 'Cable', 'Charger'];
const SKU_COUNT = 500;

const items = new Map();

function newItem(index) {
  const sku = `SKU-${String(index).padStart(5, '0')}`;

  return {
    sku,
    name: `${PRODUCTS[index % PRODUCTS.length]} ${String.fromCharCode(65 + (index % 26))}${index % 97}`,
    warehouse: WAREHOUSES[index % WAREHOUSES.length],
    onHand: 50 + Math.floor(Math.random() * 400),
    reserved: Math.floor(Math.random() * 40),
    updatedAt: new Date().toISOString(),
  };
}

const messageOf = (item) => ({ key: item.sku, value: JSON.stringify(item) });
const randomSku = () => [...items.keys()][Math.floor(Math.random() * items.size)];

await ensureTopics();

const producer = kafka.producer();

await producer.connect();

for (let index = 1; index <= SKU_COUNT; index++) {
  const item = newItem(index);

  items.set(item.sku, item);
}

await producer.send({ topic: STOCK_TOPIC, messages: [...items.values()].map(messageOf) });
console.log(`Seeded ${items.size} SKUs, now sending ${RATE} records/s`);

let nextIndex = SKU_COUNT + 1;

setInterval(async () => {
  const messages = [];

  for (let i = 0; i < Math.max(1, Math.round((RATE * TICK_MS) / 1000)); i++) {
    const roll = Math.random();

    if (roll < 0.001 && items.size > 1) {
      // Discontinue a SKU: a tombstone (null value) removes it from the compacted topic.
      const sku = randomSku();

      items.delete(sku);
      messages.push({ key: sku, value: null });
    } else if (roll < 0.002) {
      const item = newItem(nextIndex++);

      items.set(item.sku, item);
      messages.push(messageOf(item));
    } else {
      const item = items.get(randomSku());

      item.onHand = Math.max(0, item.onHand + Math.floor(Math.random() * 21) - 10);
      item.reserved = Math.min(item.onHand, Math.max(0, item.reserved + Math.floor(Math.random() * 7) - 3));
      item.updatedAt = new Date().toISOString();
      messages.push(messageOf(item));
    }
  }

  await producer.send({ topic: STOCK_TOPIC, messages });
}, TICK_MS);
