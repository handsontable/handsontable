/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import type { PasteClipboardData } from 'handsontable/base';

// Convert "1 234,50" (space or non-breaking space as the thousands separator,
// comma as the decimal separator) to "1234.50".
function toPlainNumbers(text: string): string {
  return text.replace(/(\d)[\u00a0\u202f ](?=\d{3}\b)/g, '$1').replace(/(\d),(\d)/g, '$1.$2');
}

@Component({
  selector: 'example6-clipboard',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class AppComponent {
  readonly data = [
    ['Wireless mouse', 24.9, 142],
    ['USB-C cable', 9.5, 67],
    ['Mechanical keyboard', 89, 0],
    ['Laptop stand', 45.25, 38],
    ['HDMI adapter', 12.75, 210],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Product', 'Unit price', 'Stock'],
    columns: [{}, { type: 'numeric', numericFormat: { pattern: '0,0.00' } }, { type: 'numeric' }],
    rowHeaders: true,
    beforePasteParse: (clipboardData: PasteClipboardData) => {
      clipboardData.setData('text/plain', toPlainNumbers(clipboardData.getData('text/plain')));
      // A spreadsheet also puts a <table> in text/html, and it wins over text/plain.
      clipboardData.clearData('text/html');
    },
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
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
