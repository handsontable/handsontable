/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

const data = [
  ['Spring Sale 2025', 'Email', '3.4'],
  ['Brand Awareness Q3', 'Paid Search', '8,1'],
  ['Retention Push', 'In-app', '12.0'],
  ['Partner Webinar', 'Organic', '6,75'],
  ['Holiday Preview', 'Social', '9.25'],
];

type CellMeta = { allowEmpty?: boolean };

function decimalValidator(this: CellMeta, value: unknown, callback: (valid: boolean) => void) {
  if (this.allowEmpty && (value === null || value === undefined || value === '')) {
    callback(true);

    return;
  }

  callback(/^\d+[.,]\d+$/.test(String(value)));
}

@Component({
  selector: 'example2-cell-validator',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  readonly data = data;

  readonly gridSettings: GridSettings = {
    colHeaders: ['Campaign', 'Channel', 'Conversion rate'],
    columns: [
      {},
      {},
      {
        validator: decimalValidator,
        allowInvalid: false,
      },
    ],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
  };
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
