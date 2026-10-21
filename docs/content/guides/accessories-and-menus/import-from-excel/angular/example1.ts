/* file: app.component.ts */
import { Component, NgZone, ViewChild, inject, signal } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import { HyperFormula } from 'hyperformula';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example1',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button (click)="loadSample()">Load sample</button>
        <label for="import-file">Import XLSX</label>
        <input type="file" id="import-file" accept=".xlsx" (change)="importFile($event)">
        <output role="status">{{ status() }}</output>
      </div>
    </div>

    <hot-table [settings]="hotSettings" [data]="hotData">
    </hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) hotTable!: HotTableComponent;

  private readonly zone = inject(NgZone);
  private readonly sampleUrl = '/docs/scripts/xlsx/employees.xlsx';

  // A signal, not a plain field: the import runs outside the Angular zone (see below), so nothing
  // else schedules a change detection run when the status changes.
  readonly status = signal('');

  readonly hotData = [
    ['Ana García',    'Engineering', 'Senior Engineer',    98000, true,  '2022-03-14'],
    ['James Okafor',  'Marketing',   'Marketing Manager',  87500, true,  '2021-07-01'],
    ['Li Wei',        'Engineering', 'Product Manager',   104000, false, '2020-11-23'],
    ['Priya Nair',    'Sales',       'Account Executive',  76200, true,  '2023-01-09'],
    ['Tom Bakker',    'Support',     'Support Specialist',  58900, true, '2019-05-30'],
  ];

  // One stable object that nothing replaces. The wrapper passes every key of a new `[settings]`
  // object to `updateSettings`, so a settings object you bind after an import must leave out
  // `colHeaders` and `columns`, or the sample headers and column types replace the imported ones.
  readonly hotSettings: GridSettings = {
    colHeaders: ['Name', 'Department', 'Job title', 'Salary ($)', 'Active', 'Hire date'],
    columns: [
      { type: 'text' },
      { type: 'dropdown', source: ['Engineering', 'Marketing', 'Sales', 'Support'] },
      { type: 'text' },
      { type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 } },
      { type: 'checkbox' },
      { type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
    ],
    rowHeaders: true,
    formulas: { engine: HyperFormula },
    comments: true,
    mergeCells: true,
    hiddenColumns: true,
    customBorders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    importFile: true,
  };

  loadSample(): void {
    this.zone.runOutsideAngular(async() => {
      const response = await fetch(this.sampleUrl);

      await this.importWorkbook(await response.blob(), 'employees.xlsx');
    });
  }

  importFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.zone.runOutsideAngular(async() => {
      if (file) {
        await this.importWorkbook(file, file.name);
      }

      // Cleared either way, so picking the same file again fires `change` again.
      input.value = '';
    });
  }

  // The built-in engine awaits once per archive slice, and each await would end a Zone.js turn
  // and run change detection, so the import runs outside the zone.
  private async importWorkbook(blob: Blob, name: string): Promise<void> {
    const importPlugin = this.hotTable?.hotInstance?.getPlugin('importFile');

    if (!importPlugin) {
      this.status.set('The grid is not ready.');

      return;
    }

    try {
      const result = await importPlugin.importFromBlob('xlsx', blob, {
        colHeaders: 'firstRow',
        importStyles: true,
      });

      this.status.set(`Imported ${name}`);
      console.log('Dropped features:', result.dropped);
    } catch (error) {
      // A refused file (an .xls, a password-protected or damaged workbook) rejects with a message
      // that says what to do; the grid keeps its data.
      this.status.set((error as Error).message);
    }
  }
}
/* end-file */



/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

// register Handsontable's modules
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
