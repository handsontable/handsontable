import type { StockRecord } from './grid';

interface StreamHandlers {
  onSnapshot: (rows: StockRecord[]) => void;
  onChanges: (upserts: StockRecord[], deletes: string[]) => void;
  onStatus: (connected: boolean) => void;
}

// The bridge sends a `ping` every 15 s. Silence for longer than this means the stream is
// dead, even if a proxy in between still holds the connection open.
const SILENCE_MS = 35_000;

// Reads the bridge's Server-Sent Events. Changes are buffered and handed to the grid once
// per animation frame, with only the latest record kept for each SKU.
export function connectStream(url: string, { onSnapshot, onChanges, onStatus }: StreamHandlers) {
  const upserts = new Map<string, StockRecord>();
  const deletes = new Set<string>();
  let frame = 0;
  let received = 0;
  let lastEventAt = Date.now();
  let source: EventSource;

  function flush() {
    frame = 0;
    onChanges([...upserts.values()], [...deletes]);
    upserts.clear();
    deletes.clear();
  }

  function open() {
    source = new EventSource(url);
    lastEventAt = Date.now();

    source.addEventListener('open', () => onStatus(true));
    // EventSource reconnects on its own after an error. The bridge sends a fresh snapshot
    // on every connection, so nothing is lost while the stream was down.
    source.addEventListener('error', () => onStatus(false));
    source.addEventListener('ping', () => {
      lastEventAt = Date.now();
    });

    source.addEventListener('snapshot', (event) => {
      lastEventAt = Date.now();
      upserts.clear();
      deletes.clear();
      onSnapshot(JSON.parse(event.data).rows);
    });

    source.addEventListener('changes', (event) => {
      const batch = JSON.parse(event.data) as { upserts: StockRecord[]; deletes: string[] };

      lastEventAt = Date.now();

      for (const record of batch.upserts) {
        upserts.set(record.sku, record);
        deletes.delete(record.sku);
      }

      for (const sku of batch.deletes) {
        deletes.add(sku);
        upserts.delete(sku);
      }

      received += batch.upserts.length + batch.deletes.length;
      frame ||= requestAnimationFrame(flush);
    });
  }

  open();

  // A stream that has gone silent is replaced with a new one.
  const watchdog = setInterval(() => {
    if (Date.now() - lastEventAt > SILENCE_MS) {
      onStatus(false);
      source.close();
      open();
    }
  }, 5_000);

  return {
    close: () => {
      clearInterval(watchdog);
      source.close();
    },
    // Records received since the last call, for the throughput readout.
    takeReceived: () => {
      const count = received;

      received = 0;

      return count;
    },
  };
}
