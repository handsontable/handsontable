import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

registerAllModules();

type ParsedPayload = {
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
};

const CDN_PAPAPARSE = 'https://cdn.jsdelivr.net/npm/papaparse@5.5.3/papaparse.min.js';
const CDN_XLSX = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

declare global {
  interface Window {
    Papa?: typeof Papa;
    XLSX?: typeof XLSX;
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

async function ensureXlsx(): Promise<typeof XLSX> {
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

function parseCsvText(text: string, PapaRef: typeof Papa): ParsedPayload {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error('The file is empty.');
  }

  const parsed = PapaRef.parse<string[]>(trimmed, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];

    throw new Error(first.message || 'CSV parse error.');
  }

  const fields = parsed.meta.fields?.filter((f) => f !== undefined && f !== '') ?? [];

  if (fields.length === 0) {
    throw new Error('No header row found in the CSV.');
  }

  const rows = (parsed.data as Record<string, unknown>[]).map((row) => {
    const out: Record<string, string | number | boolean | null> = {};

    for (const key of fields) {
      const v = row[key];

      if (v === null || v === undefined || v === '') {
        out[key] = null;
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        out[key] = v;
      } else {
        out[key] = String(v);
      }
    }

    return out;
  });

  if (rows.length === 0) {
    throw new Error('No data rows after the header.');
  }

  return { headers: fields, rows };
}

async function parseCsvFile(file: File, PapaRef: typeof Papa): Promise<ParsedPayload> {
  return new Promise((resolve, reject) => {
    PapaRef.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error(results.errors[0].message || 'CSV parse error.');
          }

          const fields = results.meta.fields?.filter((f) => f !== undefined && f !== '') ?? [];

          if (fields.length === 0) {
            throw new Error('No header row found in the CSV.');
          }

          const rows = (results.data as Record<string, unknown>[]).map((row) => {
            const out: Record<string, string | number | boolean | null> = {};

            for (const key of fields) {
              const v = row[key];

              if (v === null || v === undefined || v === '') {
                out[key] = null;
              } else if (typeof v === 'number' || typeof v === 'boolean') {
                out[key] = v;
              } else {
                out[key] = String(v);
              }
            }

            return out;
          });

          if (rows.length === 0) {
            throw new Error('No data rows after the header.');
          }

          resolve({ headers: fields, rows });
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      },
      error: (err) => reject(err instanceof Error ? err : new Error(String(err))),
    });
  });
}

function parseXlsxArrayBuffer(buf: ArrayBuffer, XLSXRef: typeof XLSX): ParsedPayload {
  let workbook: XLSX.WorkBook;

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
  const matrix = XLSXRef.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][];

  if (!matrix.length) {
    throw new Error('The sheet is empty.');
  }

  const rawHeader = matrix[0].map((cell) => String(cell ?? '').trim());

  if (rawHeader.length === 0 || rawHeader.every((h) => h === '')) {
    throw new Error('No header row found in the Excel sheet.');
  }

  const keys = rawHeader.map((h, i) => (h === '' ? `Column ${i + 1}` : h));

  const rows: Record<string, string | number | boolean | null>[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r];
    const allEmpty = !line || line.every((c) => String(c ?? '').trim() === '');

    if (allEmpty) {
      continue;
    }

    const obj: Record<string, string | number | boolean | null> = {};

    for (let c = 0; c < keys.length; c++) {
      const key = keys[c];
      const raw = line[c];
      const s = raw === undefined || raw === null ? '' : String(raw).trim();

      obj[key] = s === '' ? null : s;
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

let pending: ParsedPayload | null = null;

function renderHeaderPreview(listEl: HTMLElement, headers: string[]): void {
  listEl.innerHTML = '';
  for (const h of headers) {
    const li = document.createElement('li');

    li.textContent = h;
    listEl.appendChild(li);
  }
}

function columnsFromHeaders(headers: string[]): GridSettings['columns'] {
  return headers.map((data) => ({ data, type: 'text' as const }));
}

const gridContainer = document.querySelector<HTMLElement>('#example1')!;
const errEl = document.querySelector<HTMLElement>('#import-error');
const previewEl = document.querySelector<HTMLElement>('#import-preview');
const headerListEl = document.querySelector<HTMLElement>('#import-header-list');
const applyBtn = document.querySelector<HTMLButtonElement>('#import-apply');
const fileInput = document.querySelector<HTMLInputElement>('#import-file');
const dropzone = document.querySelector<HTMLElement>('#import-dropzone');
const sampleTa = document.querySelector<HTMLTextAreaElement>('#import-sample-csv');
const sampleBtn = document.querySelector<HTMLButtonElement>('#import-parse-sample');

const initialSettings: GridSettings = {
  data: [],
  columns: [],
  colHeaders: [],
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(gridContainer, initialSettings);

function setPending(payload: ParsedPayload): void {
  pending = payload;
  clearError(errEl);

  if (headerListEl && previewEl) {
    renderHeaderPreview(headerListEl, payload.headers);
    previewEl.hidden = false;
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

    setPending(payload);
  } catch (e) {
    pending = null;
    if (previewEl) {
      previewEl.hidden = true;
    }

    showError(errEl, e instanceof Error ? e.message : String(e));
  }
}

applyBtn?.addEventListener('click', () => {
  clearError(errEl);

  if (!pending) {
    showError(errEl, 'Nothing to load. Import a file first.');

    return;
  }

  const { headers, rows } = pending;

  hot.updateSettings({
    colHeaders: headers,
    columns: columnsFromHeaders(headers),
  });
  hot.loadData(rows);

  if (previewEl) {
    previewEl.hidden = true;
  }

  pending = null;
});

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
    const text = sampleTa?.value ?? '';
    const payload = parseCsvText(text, PapaRef);

    setPending(payload);
  } catch (e) {
    showError(errEl, e instanceof Error ? e.message : String(e));
  }
});
