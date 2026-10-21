import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import Papa from 'papaparse';

registerAllModules();

type ParsedPayload = {
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
};

type ParsedCellValue = string | number | boolean | null;
type ParsedRow = Record<string, ParsedCellValue>;

const CDN_PAPAPARSE = 'https://cdn.jsdelivr.net/npm/papaparse@5.5.3/papaparse.min.js';

declare global {
  interface Window {
    Papa?: typeof Papa;
  }
}

const scriptPromises = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const cached = scriptPromises.get(src);

  if (cached) {
    return cached;
  }

  const p = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-cdn="${src}"]`);

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error(`Failed to load ${src}`)),
        { once: true },
      );
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

async function ensurePapa(): Promise<typeof Papa> {
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

function showError(el: HTMLElement | null, message: string): void {
  if (!el) {
    return;
  }

  el.textContent = message;
  el.hidden = false;
}

function clearError(el: HTMLElement | null): void {
  if (!el) {
    return;
  }

  el.textContent = '';
  el.hidden = true;
}

function normalizeCellValue(value: unknown): ParsedCellValue {
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

function mapRowByHeaders(row: Record<string, unknown>, headers: string[]): ParsedRow {
  const out: ParsedRow = {};

  for (const key of headers) {
    out[key] = normalizeCellValue(row[key]);
  }

  return out;
}

function processPapaResults(results: Papa.ParseResult<Record<string, unknown>>): ParsedPayload {
  if (results.errors.length > 0) {
    throw new Error(results.errors[0].message || 'CSV parse error.');
  }

  const fields = results.meta.fields?.filter((f) => f !== undefined && f !== '') ?? [];

  if (fields.length === 0) {
    throw new Error('No header row found in the CSV.');
  }

  const rows = (results.data as Record<string, unknown>[]).map((row) => mapRowByHeaders(row, fields));

  if (rows.length === 0) {
    throw new Error('No data rows after the header.');
  }

  return { headers: fields, rows };
}

function parseCsvText(text: string, PapaRef: typeof Papa): ParsedPayload {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error('The file is empty.');
  }

  const parsed = PapaRef.parse<Record<string, unknown>>(trimmed, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  return processPapaResults(parsed);
}

async function parseCsvFile(file: File, PapaRef: typeof Papa): Promise<ParsedPayload> {
  return new Promise((resolve, reject) => {
    PapaRef.parse<Record<string, unknown>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        try {
          resolve(processPapaResults(results));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      },
      error: (err) => reject(err instanceof Error ? err : new Error(String(err))),
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

    const rows: ParsedRow[] = [];

    for (const line of result.data as unknown[][]) {
      const obj: ParsedRow = {};
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

const SAMPLE_CSV = `Product,Category,In stock,Price
Widget A,Hardware,true,19.99
Widget B,Hardware,false,24.5
Service Pack,Services,true,0`;

function columnsFromHeaders(headers: string[], rows: ParsedRow[]): GridSettings['columns'] {
  return headers.map((data) => {
    const values = rows
      .map((row) => row[data])
      .filter((v): v is string | number | boolean => v !== null);

    if (values.length > 0 && values.every((v) => typeof v === 'number')) {
      return { data, type: 'numeric' as const };
    }

    if (values.length > 0 && values.every((v) => typeof v === 'boolean')) {
      return { data, type: 'checkbox' as const };
    }

    return { data, type: 'text' as const };
  });
}

const gridContainer = document.querySelector<HTMLElement>('#example1')!;
const emptyEl = document.querySelector<HTMLElement>('#import-empty');
const errEl = document.querySelector<HTMLElement>('#import-error');
const fileInput = document.querySelector<HTMLInputElement>('#import-file');
const dropzone = document.querySelector<HTMLElement>('#import-dropzone');
const sampleBtn = document.querySelector<HTMLButtonElement>('#import-load-sample');

let hot: Handsontable | null = null;

function loadIntoGrid({ headers, rows }: ParsedPayload): void {
  const columns = columnsFromHeaders(headers, rows);

  if (!hot) {
    if (emptyEl) {
      emptyEl.hidden = true;
    }
    gridContainer.hidden = false;
    hot = new Handsontable(gridContainer, {
      data: rows,
      columns,
      colHeaders: headers,
      rowHeaders: true,
      height: 'auto',
      width: '100%',
      licenseKey: 'non-commercial-and-evaluation',
    });
  } else {
    hot.updateSettings({ colHeaders: headers, columns });
    hot.loadData(rows);
  }
}

async function handleFile(file: File | null | undefined): Promise<void> {
  clearError(errEl);

  if (!file) {
    return;
  }

  if (file.size === 0) {
    showError(errEl, 'The file is empty.');

    return;
  }

  try {
    const payload = await parseFile(file);

    loadIntoGrid(payload);
  } catch (e) {
    showError(errEl, e instanceof Error ? e.message : String(e));
  }
}

fileInput?.addEventListener('change', () => {
  const f = fileInput.files?.[0];

  handleFile(f);
  fileInput.value = '';
});

dropzone?.addEventListener('dragover', (ev) => {
  ev.preventDefault();
  dropzone.classList.add('import-dropzone--active');
});

dropzone?.addEventListener('dragleave', () => {
  dropzone.classList.remove('import-dropzone--active');
});

dropzone?.addEventListener('drop', (ev) => {
  ev.preventDefault();
  dropzone.classList.remove('import-dropzone--active');
  const f = ev.dataTransfer?.files?.[0];

  handleFile(f);
});

sampleBtn?.addEventListener('click', async () => {
  clearError(errEl);

  try {
    const PapaRef = await ensurePapa();
    const payload = parseCsvText(SAMPLE_CSV, PapaRef);

    loadIntoGrid(payload);
  } catch (e) {
    showError(errEl, e instanceof Error ? e.message : String(e));
  }
});
