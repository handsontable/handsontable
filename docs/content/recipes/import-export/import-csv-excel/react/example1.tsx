import { useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import './example1.css';

registerAllModules();

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Papa?: any;
  }
}

const CDN_PAPAPARSE = 'https://cdn.jsdelivr.net/npm/papaparse@5.5.3/papaparse.min.js';

const scriptPromises = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const cached = scriptPromises.get(src);

  if (cached) {
    return cached;
  }

  const p = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-cdn="${src}"]`) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      if (existing.getAttribute('data-loaded') === '1') {
        resolve();
      }

      return;
    }

    const s = document.createElement('script');

    s.src = src;
    s.async = true;
    s.dataset.cdn = src;
    s.onload = () => {
      s.setAttribute('data-loaded', '1');
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });

  scriptPromises.set(src, p);

  return p;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePapa(): Promise<any> {
  if (typeof window.Papa !== 'undefined') {
    return window.Papa;
  }

  await loadScript(CDN_PAPAPARSE);

  if (typeof window.Papa === 'undefined') {
    throw new Error('PapaParse did not register on window.');
  }

  return window.Papa;
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');

  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

type CellValue = string | number | boolean | null;

type ParsedPayload = {
  headers: string[];
  rows: Record<string, CellValue>[];
};

type ColumnDef = {
  data: string;
  type: 'text' | 'numeric' | 'checkbox';
};

function normalizeCellValue(value: unknown): CellValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();

  return text === '' ? null : text;
}

function mapRowByHeaders(row: Record<string, unknown>, headers: string[]): Record<string, CellValue> {
  const out: Record<string, CellValue> = {};

  for (const key of headers) {
    out[key] = normalizeCellValue(row[key]);
  }

  return out;
}

type PapaParseResults = {
  data: Record<string, unknown>[];
  errors: { message?: string }[];
  meta: { fields?: string[] };
};

function processPapaResults(results: PapaParseResults): ParsedPayload {
  if (results.errors.length > 0) {
    throw new Error(results.errors[0].message || 'CSV parse error.');
  }

  const fields = results.meta.fields?.filter((f) => f !== undefined && f !== '') ?? [];

  if (fields.length === 0) {
    throw new Error('No header row found in the CSV.');
  }

  const rows = results.data.map((row) => mapRowByHeaders(row, fields));

  if (rows.length === 0) {
    throw new Error('No data rows after the header.');
  }

  return { headers: fields, rows };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCsvText(text: string, PapaRef: any): ParsedPayload {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error('The file is empty.');
  }

  const parsed = PapaRef.parse(trimmed, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h: string) => h.trim(),
  }) as PapaParseResults;

  return processPapaResults(parsed);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseCsvFile(file: File, PapaRef: any): Promise<ParsedPayload> {
  return new Promise((resolve, reject) => {
    PapaRef.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h: string) => h.trim(),
      complete: (results: PapaParseResults) => {
        try {
          resolve(processPapaResults(results));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      },
      error: (err: unknown) => reject(err instanceof Error ? err : new Error(String(err))),
    });
  });
}

async function parseXlsxFile(file: File): Promise<ParsedPayload> {
  // A throwaway grid in a hidden element runs the ImportFile plugin. `apply: false` returns the
  // mapped sheet without touching the grid, and a refused file rejects with a message that says why.
  const host = document.createElement('div');

  host.hidden = true;
  document.body.appendChild(host);

  const parser = new Handsontable(host, {
    data: [[]],
    importFile: true,
    licenseKey: 'non-commercial-and-evaluation',
  });

  try {
    const result = await parser.getPlugin('importFile').importFromBlob('xlsx', file, {
      colHeaders: 'firstRow',
      apply: false,
    });
    const rawHeaders = (Array.isArray(result.colHeaders) ? result.colHeaders : []) as unknown[];
    const headers = rawHeaders.map((cell, i) => {
      const text = String(cell ?? '').trim();

      return text === '' ? `Column ${i + 1}` : text;
    });

    if (headers.length === 0) {
      throw new Error('No header row found in the Excel sheet.');
    }

    const rows: Record<string, CellValue>[] = [];

    for (const line of result.data as unknown[][]) {
      const obj: Record<string, CellValue> = {};
      let allEmpty = true;

      headers.forEach((key, c) => {
        obj[key] = normalizeCellValue(line[c]);
        allEmpty = allEmpty && obj[key] === null;
      });

      if (!allEmpty) {
        rows.push(obj);
      }
    }

    if (rows.length === 0) {
      throw new Error('No data rows after the header.');
    }

    return { headers, rows };
  } finally {
    parser.destroy();
    host.remove();
  }
}

async function parseFile(file: File): Promise<ParsedPayload> {
  const ext = extensionOf(file.name);

  if (ext === 'csv') {
    const PapaRef = await ensurePapa();

    return parseCsvFile(file, PapaRef);
  }

  if (ext === 'xlsx') {
    return parseXlsxFile(file);
  }

  throw new Error('Unsupported file type. Use a .csv or .xlsx file.');
}

function columnsFromHeaders(headers: string[], rows: Record<string, CellValue>[]): ColumnDef[] {
  return headers.map((data) => {
    const values = rows
      .map((row) => row[data])
      .filter((v) => v !== null);

    if (values.length > 0 && values.every((v) => typeof v === 'number')) {
      return { data, type: 'numeric' as const };
    }

    if (values.length > 0 && values.every((v) => typeof v === 'boolean')) {
      return { data, type: 'checkbox' as const };
    }

    return { data, type: 'text' as const };
  });
}

/* start:skip-in-preview */
const SAMPLE_CSV = `Product,Category,In stock,Price
Widget A,Hardware,true,19.99
Widget B,Hardware,false,24.5
Service Pack,Services,true,0`;
/* end:skip-in-preview */

const ExampleComponent = () => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [dropzoneActive, setDropzoneActive] = useState<boolean>(false);
  const [gridData, setGridData] = useState<Record<string, CellValue>[]>([]);
  const [gridColHeaders, setGridColHeaders] = useState<string[]>([]);
  const [gridColumns, setGridColumns] = useState<ColumnDef[]>([]);

  const loadIntoGrid = ({ headers, rows }: ParsedPayload): void => {
    setErrorMessage('');
    setGridColHeaders(headers);
    setGridColumns(columnsFromHeaders(headers, rows));
    setGridData(rows);
  };

  const handleError = (e: unknown): void => {
    setErrorMessage(e instanceof Error ? e.message : String(e));
  };

  const handleFile = async (file: File | undefined): Promise<void> => {
    setErrorMessage('');

    if (!file) {
      return;
    }

    if (file.size === 0) {
      setErrorMessage('The file is empty.');

      return;
    }

    try {
      const payload = await parseFile(file);

      loadIntoGrid(payload);
    } catch (e) {
      handleError(e);
    }
  };

  const handleFileInputChange = (ev: React.ChangeEvent<HTMLInputElement>): void => {
    const f = ev.target.files?.[0];

    handleFile(f);
    ev.target.value = '';
  };

  const handleDragOver = (ev: React.DragEvent<HTMLDivElement>): void => {
    ev.preventDefault();
    setDropzoneActive(true);
  };

  const handleDragLeave = (): void => {
    setDropzoneActive(false);
  };

  const handleDrop = (ev: React.DragEvent<HTMLDivElement>): void => {
    ev.preventDefault();
    setDropzoneActive(false);
    const f = ev.dataTransfer?.files?.[0];

    handleFile(f);
  };

  const handleLoadSample = async (): Promise<void> => {
    setErrorMessage('');

    try {
      const PapaRef = await ensurePapa();
      const payload = parseCsvText(SAMPLE_CSV, PapaRef);

      loadIntoGrid(payload);
    } catch (e) {
      handleError(e);
    }
  };

  return (
    <div className="import-csv-excel-wrap">
      <div
        className={`import-dropzone${dropzoneActive ? ' import-dropzone--active' : ''}`}
        tabIndex={0}
        role="button"
        aria-label="Drop a CSV or Excel file here"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>
          Drop a <code>.csv</code> or <code>.xlsx</code> file here, or pick a source.
        </p>
        <div className="import-actions">
          <label className="import-file-label">
            <span>Choose file</span>
            <input
              type="file"
              accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onChange={handleFileInputChange}
            />
          </label>
          <button type="button" className="import-sample-btn" onClick={handleLoadSample}>
            Load sample data
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="import-msg import-msg--error">{errorMessage}</div>
      )}

      {gridData.length === 0 ? (
        <div className="import-empty">
          <span className="import-empty-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
          </span>
          <p className="import-empty-title">No data loaded yet</p>
          <p className="import-empty-text">
            Drop a CSV or Excel file above, choose a file, or load the sample data to populate the table.
          </p>
        </div>
      ) : (
        <HotTable
          data={gridData}
          columns={gridColumns}
          colHeaders={gridColHeaders}
          rowHeaders={true}
          height="auto"
          width="100%"
          licenseKey="non-commercial-and-evaluation"
        />
      )}
    </div>
  );
};

export default ExampleComponent;
