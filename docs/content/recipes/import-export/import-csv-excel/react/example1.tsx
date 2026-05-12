import { useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import './example1.css';

registerAllModules();

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Papa?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    XLSX?: any;
  }
}

const CDN_PAPAPARSE = 'https://cdn.jsdelivr.net/npm/papaparse@5.5.3/papaparse.min.js';
const CDN_XLSX = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureXlsx(): Promise<any> {
  if (typeof window.XLSX !== 'undefined') {
    return window.XLSX;
  }

  await loadScript(CDN_XLSX);

  if (typeof window.XLSX === 'undefined') {
    throw new Error('SheetJS did not register on window.');
  }

  return window.XLSX;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseXlsxArrayBuffer(buf: ArrayBuffer, XLSXRef: any): ParsedPayload {
  let workbook: { SheetNames: string[]; Sheets: Record<string, unknown> };

  try {
    workbook = XLSXRef.read(buf, { type: 'array' });
  } catch {
    throw new Error('Could not read the Excel workbook. The file may be corrupted.');
  }

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('The workbook has no sheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSXRef.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
  }) as unknown[][];

  if (!matrix.length) {
    throw new Error('The sheet is empty.');
  }

  const rawHeader = (matrix[0] as unknown[]).map((cell) => String(cell ?? '').trim());

  if (rawHeader.length === 0 || rawHeader.every((h) => h === '')) {
    throw new Error('No header row found in the Excel sheet.');
  }

  const keys = rawHeader.map((h, i) => (h === '' ? `Column ${i + 1}` : h));
  const rows: Record<string, CellValue>[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r] as unknown[];
    const allEmpty = !line || line.every((c) => normalizeCellValue(c) === null);

    if (allEmpty) {
      continue;
    }

    const obj: Record<string, CellValue> = {};

    for (let c = 0; c < keys.length; c++) {
      const key = keys[c];
      const raw = line[c];

      obj[key] = normalizeCellValue(raw);
    }

    rows.push(obj);
  }

  if (rows.length === 0) {
    throw new Error('No data rows after the header.');
  }

  return { headers: keys, rows };
}

async function parseFile(file: File): Promise<ParsedPayload> {
  const ext = extensionOf(file.name);

  if (ext === 'csv') {
    const PapaRef = await ensurePapa();

    return parseCsvFile(file, PapaRef);
  }

  if (ext === 'xlsx') {
    const XLSXRef = await ensureXlsx();
    const buf = await file.arrayBuffer();

    return parseXlsxArrayBuffer(buf, XLSXRef);
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
