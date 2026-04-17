/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';
import type { CellMeta, CellProperties } from 'handsontable/settings';

const STATUS_ROW_CLASSES: Record<string, string> = {
  active: 'ht-demo-row-status-active',
  pending: 'ht-demo-row-status-pending',
  inactive: 'ht-demo-row-status-inactive',
};

function statusToRowClass(status: unknown): string | undefined {
  if (typeof status !== 'string') {
    return undefined;
  }

  return STATUS_ROW_CLASSES[status];
}

@Component({
  selector: 'example1-conditional-row-coloring',
  standalone: false,
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class Example1ConditionalRowColoringComponent {
  readonly data = [
    { task: 'Invoice export', owner: 'A. Lee', status: 'active' },
    { task: 'SSO rollout', owner: 'M. Costa', status: 'pending' },
    { task: 'Legacy reports', owner: 'J. Park', status: 'inactive' },
    { task: 'API docs', owner: 'R. Singh', status: 'active' },
    { task: 'Mobile parity', owner: 'T. Nguyen', status: 'pending' },
  ];

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: ['Task', 'Owner', 'Status'],
    height: 'auto',
    width: '100%',
    columns: [
      { data: 'task', type: 'text', width: 220 },
      { data: 'owner', type: 'text', width: 120 },
      {
        data: 'status',
        type: 'dropdown',
        width: 120,
        source: ['active', 'pending', 'inactive'],
        strict: true,
        allowInvalid: false,
      },
    ],
    cells(
      this: CellProperties,
      row: number,
      _column: number,
      _prop: string | number,
    ): CellMeta {
      const hot = this.instance;
      const visualRow = hot.toVisualRow(row);

      if (visualRow === null || visualRow < 0) {
        return {};
      }

      const status = hot.getDataAtRowProp(visualRow, 'status');
      const rowClass = statusToRowClass(status);

      if (!rowClass) {
        return {};
      }

      return { className: rowClass };
    },
    afterValidate(
      this: Handsontable,
      isValid: boolean,
      _value: Handsontable.CellValue,
      row: number,
      prop: string | number,
    ): void {
      if (isValid) {
        return;
      }

      const col = this.propToCol(prop);
      const td = this.getCell(row, col);

      if (!td) {
        return;
      }

      td.classList.add('ht-demo-invalid-flash');
      setTimeout(() => td.classList.remove('ht-demo-invalid-flash'), 800);
    },
  };
}
/* end-file */

/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example1ConditionalRowColoringComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig,
    },
  ],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [Example1ConditionalRowColoringComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1ConditionalRowColoringComponent],
})
export class AppModule {}
/* end-file */
