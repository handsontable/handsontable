/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ParsedPayload {
  headers: string[];
  rows: Record<string, unknown>[];
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function normalizeCellValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
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
    const out: Record<string, unknown> = {};
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
    throw new Error('The input is empty.');
  }
  const parsed = Papa.parse<Record<string, unknown>>(trimmed, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  return processPapaResults(parsed);
}

async function parseCsvFile(file: File): Promise<ParsedPayload> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
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
  const buf = await file.arrayBuffer();
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buf, { type: 'array' });
  } catch {
    throw new Error('Could not read the Excel workbook. The file may be corrupted.');
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The workbook has no sheets.');
  }
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true });
  if (!matrix.length) {
    throw new Error('The sheet is empty.');
  }
  const rawHeader = (matrix[0] as unknown[]).map((cell) => String(cell ?? '').trim());
  if (rawHeader.length === 0 || rawHeader.every((h) => h === '')) {
    throw new Error('No header row found in the Excel sheet.');
  }
  const keys = rawHeader.map((h, i) => (h === '' ? `Column ${i + 1}` : h));
  const rows: Record<string, unknown>[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r] as unknown[];
    const allEmpty = !line || (line as unknown[]).every((c) => normalizeCellValue(c) === null);
    if (allEmpty) {
      continue;
    }
    const obj: Record<string, unknown> = {};
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

async function parseFile(file: File): Promise<ParsedPayload> {
  const ext = extensionOf(file.name);
  if (ext === 'csv') {
    return parseCsvFile(file);
  }
  if (ext === 'xlsx') {
    return parseXlsxFile(file);
  }
  throw new Error('Unsupported file type. Use a .csv or .xlsx file.');
}

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-import-csv-excel',
  template: `
    <div class="import-csv-excel-wrap">
      <div
        class="import-dropzone"
        [class.import-dropzone--active]="isDragOver"
        tabindex="0"
        role="button"
        aria-label="Drop a CSV or Excel file here"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave()"
        (drop)="onDrop($event)"
      >
        <p>Drop a <code>.csv</code> or <code>.xlsx</code> file here, or use the file picker.</p>
        <label class="import-file-label">
          <span>Choose file</span>
          <input
            type="file"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            (change)="onFileChange($event)"
            #fileInput
          />
        </label>
      </div>

      <div class="import-sample-block">
        <label for="import-sample-csv-ng">Sample CSV (click <strong>Parse sample CSV</strong> to preview):</label>
        <textarea
          id="import-sample-csv-ng"
          rows="5"
          spellcheck="false"
          [value]="sampleCsv"
          (input)="sampleCsv = $any($event.target).value"
        ></textarea>
        <div class="import-sample-actions">
          <button type="button" (click)="parseSampleCsv()">Parse sample CSV</button>
        </div>
      </div>

      @if (errorMessage) {
        <div class="import-msg import-msg--error">{{ errorMessage }}</div>
      }

      @if (showPreview) {
        <div class="import-preview">
          <p class="import-preview-title">Detected column headers (not loaded yet):</p>
          <ul class="import-header-list">
            @for (h of pending?.headers ?? []; track h) {
              <li>{{ h }}</li>
            }
          </ul>
          <button type="button" class="import-apply-btn" (click)="applyToGrid()">Load into grid</button>
        </div>
      }

      <hot-table [data]="gridData" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  isDragOver = false;
  errorMessage = '';
  showPreview = false;
  pending: ParsedPayload | null = null;
  gridData: Record<string, unknown>[] = [];

  sampleCsv = `Product,Category,In stock,Price
Widget A,Hardware,true,19.99
Widget B,Hardware,false,24.5
Service Pack,Services,true,0`;

  gridSettings: GridSettings = {
    colHeaders: [],
    columns: [],
    rowHeaders: true,
    height: 'auto',
    width: '100%',
  };

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
    input.value = '';
  }

  async parseSampleCsv(): Promise<void> {
    this.errorMessage = '';
    try {
      const payload = parseCsvText(this.sampleCsv);
      this.setPending(payload);
    } catch (e) {
      this.clearPendingPreview();
      this.errorMessage = e instanceof Error ? e.message : String(e);
    }
  }

  applyToGrid(): void {
    this.errorMessage = '';
    if (!this.pending) {
      this.errorMessage = 'Nothing to load. Import a file first.';
      return;
    }
    const { headers, rows } = this.pending;
    this.gridSettings = {
      ...this.gridSettings,
      colHeaders: headers,
      columns: this.columnsFromHeaders(headers),
    };
    this.gridData = [...rows];
    this.showPreview = false;
    this.pending = null;
  }

  private async handleFile(file: File): Promise<void> {
    this.errorMessage = '';
    if (file.size === 0) {
      this.errorMessage = 'The file is empty.';
      return;
    }
    try {
      const payload = await parseFile(file);
      this.setPending(payload);
    } catch (e) {
      this.clearPendingPreview();
      this.errorMessage = e instanceof Error ? e.message : String(e);
    }
  }

  private setPending(payload: ParsedPayload): void {
    this.pending = payload;
    this.errorMessage = '';
    this.showPreview = true;
  }

  private clearPendingPreview(): void {
    this.pending = null;
    this.showPreview = false;
  }

  private columnsFromHeaders(headers: string[]): GridSettings['columns'] {
    if (!this.pending) {
      return headers.map((data) => ({ data, type: 'text' }));
    }
    return headers.map((data) => {
      const values = (this.pending?.rows ?? [])
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
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
