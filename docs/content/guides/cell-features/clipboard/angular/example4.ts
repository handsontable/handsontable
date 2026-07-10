/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import Handsontable from 'handsontable/base';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

type CopyRange = { startRow: number; startCol: number; endRow: number; endCol: number };

function collectClassNames(hot: Handsontable, coords: CopyRange[]): string[][] {
  const source = coords[0];
  const classNames: string[][] = [];

  if (!source) {
    return classNames;
  }

  for (let row = source.startRow; row <= source.endRow; row += 1) {
    const rowClassNames: string[] = [];

    for (let col = source.startCol; col <= source.endCol; col += 1) {
      rowClassNames.push((hot.getCellMeta(row, col).className as string | undefined) ?? '');
    }

    classNames.push(rowClassNames);
  }

  return classNames;
}

@Component({
  selector: 'example4-clipboard',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  copiedClassNames: string[][] = [];

  readonly data = [
    ['Wireless mouse', 142, 'In stock'],
    ['USB-C cable', 67, 'In stock'],
    ['Mechanical keyboard', 0, 'Backordered'],
    ['Laptop stand', 38, 'In stock'],
    ['HDMI adapter', 210, 'In stock'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Product', 'Stock', 'Status'],
    rowHeaders: true,
    cell: [
      { row: 0, col: 1, className: 'htRight' },
      { row: 0, col: 2, className: 'htCenter' },
      { row: 2, col: 1, className: 'htRight htDimmed' },
      { row: 2, col: 2, className: 'htCenter htDimmed' },
    ],
    afterCopy: (_data, coords) => {
      this.copiedClassNames = collectClassNames(this.hotTable.hotInstance, coords as CopyRange[]);
    },
    afterPaste: (_data, coords) => {
      const target = (coords as CopyRange[])[0];
      const hot = this.hotTable.hotInstance;

      if (!target) {
        return;
      }

      hot.batch(() => {
        this.copiedClassNames.forEach((rowClassNames, rowOffset) => {
          rowClassNames.forEach((className, colOffset) => {
            hot.setCellMeta(target.startRow + rowOffset, target.startCol + colOffset, 'className', className);
          });
        });
      });

      hot.render();
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
