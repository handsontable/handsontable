/* file: app.component.ts */
import { ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import Papa from 'papaparse';

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

    const rows: Record<string, unknown>[] = [];

    for (const line of result.data as unknown[][]) {
      const obj: Record<string, unknown> = {};
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
        <p>Drop a <code>.csv</code> or <code>.xlsx</code> file here, or pick a source.</p>
        <div class="import-actions">
          <label class="import-file-label">
            <span>Choose file</span>
            <input
              type="file"
              accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              (change)="onFileChange($event)"
              #fileInput
            />
          </label>
          <button type="button" class="import-sample-btn" (click)="loadSampleData()">Load sample data</button>
        </div>
      </div>

      @if (errorMessage) {
        <div class="import-msg import-msg--error">{{ errorMessage }}</div>
      }

      @if (gridData.length === 0) {
        <div class="import-empty">
          <span class="import-empty-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18"/>
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
            </svg>
          </span>
          <p class="import-empty-title">No data loaded yet</p>
          <p class="import-empty-text">
            Drop a CSV or Excel file above, choose a file, or load the sample data to populate the table.
          </p>
        </div>
      } @else {
        <hot-table [data]="gridData" [settings]="gridSettings"></hot-table>
      }
    </div>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  private readonly cdr = inject(ChangeDetectorRef);

  isDragOver = false;
  errorMessage = '';
  gridData: Record<string, unknown>[] = [];

  private readonly SAMPLE_CSV = `Product,Category,In stock,Price
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

  async loadSampleData(): Promise<void> {
    this.errorMessage = '';
    try {
      const payload = parseCsvText(this.SAMPLE_CSV);
      this.loadIntoGrid(payload);
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : String(e);
    }
  }

  private async handleFile(file: File): Promise<void> {
    this.errorMessage = '';
    if (file.size === 0) {
      this.errorMessage = 'The file is empty.';
      return;
    }
    try {
      const payload = await parseFile(file);
      this.loadIntoGrid(payload);
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : String(e);
    } finally {
      this.cdr.markForCheck();
    }
  }

  private loadIntoGrid(payload: ParsedPayload): void {
    const { headers, rows } = payload;
    this.gridSettings = {
      ...this.gridSettings,
      colHeaders: headers,
      columns: this.columnsFromHeaders(headers, rows),
    };
    this.gridData = [...rows];
  }

  private columnsFromHeaders(headers: string[], rows: Record<string, unknown>[]): GridSettings['columns'] {
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
