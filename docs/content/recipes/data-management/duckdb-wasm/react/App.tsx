import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { HotTableRef } from '@handsontable/react-wrapper';

import OrdersGrid from './OrdersGrid';
import { onFetchStats, type FetchStats } from './ordersProvider';
import { exportParquet, loadFile, ROW_COUNT, seedOrders } from './seed';

type Status =
  | { state: 'loading' }
  | { state: 'ready'; seedMs: number }
  | { state: 'error'; message: string };

const format = new Intl.NumberFormat('en-US');

// StrictMode runs effects twice in development; seed only once per page load.
let seeding: Promise<number> | null = null;

function seedOnce(): Promise<number> {
  seeding ??= (async () => {
    const started = performance.now();

    await seedOrders();

    return performance.now() - started;
  })();

  return seeding;
}

export default function App() {
  const gridRef = useRef<HotTableRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ state: 'loading' });
  const [stats, setStats] = useState<FetchStats | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    onFetchStats(setStats);
    seedOnce()
      .then((seedMs) => setStatus({ state: 'ready', seedMs }))
      .catch((error: Error) => setStatus({ state: 'error', message: error.message }));
  }, []);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    setMessage(`Loading ${file.name}…`);

    try {
      const total = await loadFile(file);

      setMessage(`Loaded ${format.format(total)} rows from ${file.name}`);
      await gridRef.current?.hotInstance?.getPlugin('dataProvider').fetchData({ page: 1 });
    } catch (error) {
      setMessage(`Couldn't load ${file.name}: ${(error as Error).message}`);
    }
  }

  async function handleExport() {
    try {
      const url = URL.createObjectURL(await exportParquet());
      const link = Object.assign(document.createElement('a'), { href: url, download: 'orders.parquet' });

      link.click();
      // Revoke after the click is handled, so the browser has started the download.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      setMessage(`Couldn't export: ${(error as Error).message}`);
    }
  }

  return (
    <main>
      <header>
        <h1>{format.format(ROW_COUNT)} rows, no backend</h1>
        <p>
          Handsontable's <code>dataProvider</code> sends every page, sort, filter and edit to
          DuckDB-Wasm running in a Web Worker. The grid only ever holds one page.
        </p>
      </header>

      <section className="toolbar" aria-live="polite">
        {status.state === 'loading' && <span>Generating {format.format(ROW_COUNT)} rows in DuckDB…</span>}
        {status.state === 'error' && <span className="error">DuckDB failed to start: {status.message}</span>}
        {status.state === 'ready' && (
          <>
            <span className="stat">Seeded in <strong>{Math.round(status.seedMs)} ms</strong></span>
            {stats && (
              <>
                <span className="stat">Matching rows <strong>{format.format(stats.totalRows)}</strong></span>
                <span className="stat">Last query <strong>{stats.ms.toFixed(1)} ms</strong></span>
              </>
            )}
            <span className="spacer" />
            {/* A native button stays in the tab order and opens the hidden file input. */}
            <button type="button" className="button" onClick={() => fileInputRef.current?.click()}>
              Load Parquet or CSV
            </button>
            <input ref={fileInputRef} type="file" accept=".parquet,.csv" onChange={handleFile} hidden />
            <button type="button" className="button" onClick={handleExport}>Export Parquet</button>
          </>
        )}
      </section>

      {message && <p className="message">{message}</p>}

      {status.state === 'ready' && <OrdersGrid ref={gridRef} />}
    </main>
  );
}
