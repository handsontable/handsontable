<script setup lang="ts">
import { ref, shallowRef, computed } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file/browser';
import type { Sheet } from 'read-excel-file/browser';

registerAllModules();

type CellValue = string | number | boolean | null;

interface ParsedPayload {
  headers: string[];
  rows: Record<string, CellValue>[];
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');

  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

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

function processPapaResults(results: Papa.ParseResult<Record<string, unknown>>): ParsedPayload {
  if (results.errors.length > 0) {
    throw new Error(results.errors[0].message || 'CSV parse error.');
  }

  const fields = (results.meta.fields ?? []).filter((f) => f !== undefined && f !== '');

  if (fields.length === 0) {
    throw new Error('No header row found in the CSV.');
  }

  const rows = results.data.map((row) => {
    const out: Record<string, CellValue> = {};

    for (const key of fields) {
      out[key] = normalizeCellValue(row[key]);
    }

    return out;
  });

  if (rows.length === 0) {
    throw new Error('No data rows after the header.');
  }

  return { headers: fields, rows };
}

function parseCsvText(text: string): ParsedPayload {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error('The file is empty.');
  }

  const parsed = Papa.parse<Record<string, unknown>>(trimmed, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  return processPapaResults(parsed);
}

function parseCsvFile(file: File): Promise<ParsedPayload> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h: string) => h.trim(),
      complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
        try {
          resolve(processPapaResults(results));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      },
      error: (err: Error) => reject(err instanceof Error ? err : new Error(String(err))),
    });
  });
}

async function parseXlsxFile(file: File): Promise<ParsedPayload> {
  let sheets: Sheet[];

  try {
    sheets = await readXlsxFile(file);
  } catch {
    throw new Error('Could not read the Excel workbook. The file may be corrupted.');
  }

  const firstSheet = sheets[0];

  if (!firstSheet) {
    throw new Error('The workbook has no sheets.');
  }

  const matrix: unknown[][] = firstSheet.data;

  if (!matrix.length) {
    throw new Error('The sheet is empty.');
  }

  const rawHeader = matrix[0].map((cell) => String(cell ?? '').trim());

  if (rawHeader.length === 0 || rawHeader.every((h) => h === '')) {
    throw new Error('No header row found in the Excel sheet.');
  }

  const keys = rawHeader.map((h, i) => (h === '' ? `Column ${i + 1}` : h));
  const rows: Record<string, CellValue>[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r];
    const allEmpty = !line || line.every((c) => normalizeCellValue(c) === null);

    if (allEmpty) {
      continue;
    }

    const obj: Record<string, CellValue> = {};

    for (let c = 0; c < keys.length; c++) {
      obj[keys[c]] = normalizeCellValue(line[c]);
    }

    rows.push(obj);
  }

  if (rows.length === 0) {
    throw new Error('No data rows after the header.');
  }

  return { headers: keys, rows };
}

function parseFile(file: File): Promise<ParsedPayload> {
  const ext = extensionOf(file.name);

  if (ext === 'csv') {
    return parseCsvFile(file);
  }

  if (ext === 'xlsx') {
    return parseXlsxFile(file);
  }

  return Promise.reject(new Error('Unsupported file type. Use a .csv or .xlsx file.'));
}

function columnsFromHeaders(headers: string[], rows: Record<string, CellValue>[]): GridSettings['columns'] {
  return headers.map((data) => {
    const values = rows
      .map((row) => row[data])
      .filter((v) => v !== null);

    if (values.length > 0 && values.every((v) => typeof v === 'number')) {
      return { data, type: 'numeric' };
    }

    if (values.length > 0 && values.every((v) => typeof v === 'boolean')) {
      return { data, type: 'checkbox' };
    }

    return { data, type: 'text' };
  });
}

const SAMPLE_CSV = `Product,Category,In stock,Price
Widget A,Hardware,true,19.99
Widget B,Hardware,false,24.5
Service Pack,Services,true,0`;

const isDragOver = ref(false);
const errorMessage = ref('');
const payload = shallowRef<ParsedPayload | null>(null);
const importCount = ref(0);

const hotSettings = computed<GridSettings>(() => ({
  data: payload.value?.rows ?? [],
  colHeaders: payload.value?.headers ?? [],
  columns: payload.value ? columnsFromHeaders(payload.value.headers, payload.value.rows) : [],
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  licenseKey: 'non-commercial-and-evaluation',
}));

function loadIntoGrid(parsed: ParsedPayload): void {
  payload.value = parsed;
  importCount.value += 1;
}

function showError(e: unknown): void {
  errorMessage.value = e instanceof Error ? e.message : String(e);
}

async function handleFile(file: File | undefined): Promise<void> {
  errorMessage.value = '';

  if (!file) {
    return;
  }

  if (file.size === 0) {
    errorMessage.value = 'The file is empty.';

    return;
  }

  try {
    loadIntoGrid(await parseFile(file));
  } catch (e) {
    showError(e);
  }
}

function loadSampleData(): void {
  errorMessage.value = '';

  try {
    loadIntoGrid(parseCsvText(SAMPLE_CSV));
  } catch (e) {
    showError(e);
  }
}

function onDragOver(event: DragEvent): void {
  event.preventDefault();
  isDragOver.value = true;
}

function onDrop(event: DragEvent): void {
  event.preventDefault();
  isDragOver.value = false;
  handleFile(event.dataTransfer?.files?.[0]);
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;

  handleFile(input.files?.[0]);
  input.value = '';
}
</script>

<template>
  <div id="example1" class="import-csv-excel-wrap">
    <div
      class="import-dropzone"
      :class="{ 'import-dropzone--active': isDragOver }"
      tabindex="0"
      role="button"
      aria-label="Drop a CSV or Excel file here"
      @dragover="onDragOver"
      @dragleave="isDragOver = false"
      @drop="onDrop"
    >
      <p>Drop a <code>.csv</code> or <code>.xlsx</code> file here, or pick a source.</p>
      <div class="import-actions">
        <label class="import-file-label">
          <span>Choose file</span>
          <input
            type="file"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            @change="onFileChange"
          />
        </label>
        <button type="button" class="import-sample-btn" @click="loadSampleData">Load sample data</button>
      </div>
    </div>

    <div v-if="errorMessage" class="import-msg import-msg--error">{{ errorMessage }}</div>

    <div v-if="!payload" class="import-empty">
      <span class="import-empty-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" />
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
        </svg>
      </span>
      <p class="import-empty-title">No data loaded yet</p>
      <p class="import-empty-text">
        Drop a CSV or Excel file above, choose a file, or load the sample data to populate the table.
      </p>
    </div>
    <HotTable v-else :key="importCount" :settings="hotSettings" />
  </div>
</template>
