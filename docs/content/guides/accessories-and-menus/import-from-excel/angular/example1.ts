/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import ExcelJS from 'exceljs';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example1',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <label for="import-file">Import XLSX</label>
        <input type="file" id="import-file" accept=".xlsx" (change)="importFile($event)">
      </div>
    </div>

    <hot-table [settings]="hotSettings" [data]="hotData">
    </hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) hotTable!: HotTableComponent;

  readonly hotData = [
    ['Ana García',    'Engineering', 'Senior Engineer',    98000, true,  '2022-03-14'],
    ['James Okafor',  'Marketing',   'Marketing Manager',  87500, true,  '2021-07-01'],
    ['Li Wei',        'Engineering', 'Product Manager',   104000, false, '2020-11-23'],
    ['Priya Nair',    'Sales',       'Account Executive',  76200, true,  '2023-01-09'],
    ['Tom Bakker',    'Support',     'Support Specialist',  58900, true, '2019-05-30'],
  ];

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
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    importFile: { engines: { xlsx: ExcelJS } },
  };

  async importFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const importPlugin = this.hotTable.hotInstance!.getPlugin('importFile');
    const result = await importPlugin.importFromBlob('xlsx', file, {
      colHeaders: 'firstRow',
    });

    console.log('Dropped features:', result.dropped);

    input.value = '';
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
