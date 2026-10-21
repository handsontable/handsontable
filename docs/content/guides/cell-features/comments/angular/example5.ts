/* file: app.component.ts */
import { Component } from '@angular/core';
import Handsontable from 'handsontable/base';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example5-comments',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    ['Wireless mouse', 142],
    ['USB-C cable', 67],
    ['Mechanical keyboard', -5],
    ['Laptop stand', 38],
    ['HDMI adapter', 210],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Product', 'Stock'],
    rowHeaders: true,
    comments: true,
    columns: [
      {},
      {
        type: 'numeric',
        validator(value: any, callback: (valid: boolean) => void) {
          callback(Number.isInteger(value) && value >= 0);
        },
      },
    ],
    // Attach a comment when a cell fails validation, and remove it once the cell is valid.
    afterValidate(this: Handsontable, isValid: boolean, value: any, row: number, prop: string | number) {
      const column = this.propToCol(prop);

      // Skip a property that names no column.
      if (column === null) {
        return;
      }

      const comments = this.getPlugin('comments');

      if (!isValid) {
        comments.setCommentAtCell(row, column, `"${value}" is not valid. Enter a whole number of 0 or more.`);
      } else {
        comments.removeCommentAtCell(row, column);
      }
    },
    // Validate every cell on load so the pre-existing invalid value is flagged right away.
    afterInit(this: Handsontable) {
      this.validateCells();
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
