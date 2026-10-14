import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const CDN_PAPAPARSE = 'https://cdn.jsdelivr.net/npm/papaparse@5.5.3/papaparse.min.js';

const scriptPromises = new Map();

function loadScript(src) {
  const cached = scriptPromises.get(src);

  if (cached) {
    return cached;
  }

  const p = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-cdn="${src}"]`);

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

async function ensurePapa() {
  if (typeof window.Papa !== 'undefined') {
    return window.Papa;
  }

  await loadScript(CDN_PAPAPARSE);

  if (typeof window.Papa === 'undefined') {
    throw new Error('PapaParse did not register on window.');
  }

  return window.Papa;
}

function extensionOf(name) {
  const i = name.lastIndexOf('.');

  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function showError(el, message) {
  if (!el) {
    return;
  }

  el.textContent = message;
  el.hidden = false;
}

function clearError(el) {
  if (!el) {
    return;
  }

  el.textContent = '';
  el.hidden = true;
}

function normalizeCellValue(value) {
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

function mapRowByHeaders(row, headers) {
  const out = {};

  for (const key of headers) {
    out[key] = normalizeCellValue(row[key]);
  }

  return out;
}

function processPapaResults(results) {
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

function parseCsvText(text, PapaRef) {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error('The file is empty.');
  }

  const parsed = PapaRef.parse(trimmed, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  return processPapaResults(parsed);
}

async function parseCsvFile(file, PapaRef) {
  return new Promise((resolve, reject) => {
    PapaRef.parse(file, {
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

async function parseXlsxFile(file) {
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
    const rawHeaders = Array.isArray(result.colHeaders) ? result.colHeaders : [];
    const headers = rawHeaders.map((cell, i) => {
      const text = String(cell ?? '').trim();

      return text === '' ? `Column ${i + 1}` : text;
    });

    if (headers.length === 0) {
      throw new Error('No header row found in the Excel sheet.');
    }

    const rows = [];

    for (const line of result.data) {
      const obj = {};
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

async function parseFile(file) {
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

function columnsFromHeaders(headers, rows) {
  return headers.map((data) => {
    const values = rows.map((row) => row[data]).filter((v) => v !== null);

    if (values.length > 0 && values.every((v) => typeof v === 'number')) {
      return { data, type: 'numeric' };
    }

    if (values.length > 0 && values.every((v) => typeof v === 'boolean')) {
      return { data, type: 'checkbox' };
    }

    return { data, type: 'text' };
  });
}

const gridContainer = document.querySelector('#example1');
const emptyEl = document.querySelector('#import-empty');
const errEl = document.querySelector('#import-error');
const fileInput = document.querySelector('#import-file');
const dropzone = document.querySelector('#import-dropzone');
const sampleBtn = document.querySelector('#import-load-sample');

let hot = null;

function loadIntoGrid({ headers, rows }) {
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

async function handleFile(file) {
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
