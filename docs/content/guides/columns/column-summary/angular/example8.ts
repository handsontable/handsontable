/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example8',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button class="button button--primary" (click)="throwErrors()">
          Throw data type errors
        </button>
      </div>
    </div>
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly hotData = [[0, 1, 2], ['3c', '4b', 5], [], []];

  readonly hotSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    columnSummary: [
      {
        type: 'sum',
        destinationRow: 0,
        destinationColumn: 0,
        reversedRowCoords: true,
      },
      {
        type: 'sum',
        destinationRow: 0,
        destinationColumn: 1,
        reversedRowCoords: true,
      },
    ],
    autoWrapRow: true,
    autoWrapCol: true,
    height: 'auto',
  };

  throwErrors(): void {
    this.hotTable?.hotInstance?.updateSettings({
      columnSummary: [
        {
          type: 'sum',
          destinationRow: 0,
          destinationColumn: 0,
          reversedRowCoords: true,
          suppressDataTypeErrors: false,
        },
        {
          type: 'sum',
          destinationRow: 0,
          destinationColumn: 1,
          reversedRowCoords: true,
          suppressDataTypeErrors: false,
        },
      ],
    });
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
