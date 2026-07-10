/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import Handsontable from 'handsontable/base';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

type CopyRange = { startRow: number; startCol: number; endRow: number; endCol: number };

function collectComments(hot: Handsontable, coords: CopyRange[]): (string | undefined)[][] {
  const source = coords[0];
  const comments = hot.getPlugin('comments');
  const copied: (string | undefined)[][] = [];

  if (!source) {
    return copied;
  }

  for (let row = source.startRow; row <= source.endRow; row += 1) {
    const rowComments: (string | undefined)[] = [];

    for (let col = source.startCol; col <= source.endCol; col += 1) {
      rowComments.push(comments.getCommentAtCell(row, col));
    }

    copied.push(rowComments);
  }

  return copied;
}

@Component({
  selector: 'example5-clipboard',
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

  copiedComments: (string | undefined)[][] = [];

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
    comments: true,
    cell: [
      { row: 0, col: 1, comment: { value: 'Counted during the July audit.' } },
      { row: 2, col: 1, comment: { value: 'Reorder request sent to Harbor Goods.' } },
      { row: 2, col: 2, comment: { value: 'Expected delivery is July 18.' } },
    ],
    afterCopy: (_data: unknown[][], coords: CopyRange[]) => {
      this.copiedComments = collectComments(this.hotTable.hotInstance!, coords);
    },
    afterCut: (_data: unknown[][], coords: CopyRange[]) => {
      this.copiedComments = collectComments(this.hotTable.hotInstance!, coords);
    },
    afterPaste: (_data: unknown[][], coords: CopyRange[]) => {
      const target = coords[0];
      const hot = this.hotTable.hotInstance!;
      const comments = hot.getPlugin('comments');

      if (!target) {
        return;
      }

      hot.batch(() => {
        this.copiedComments.forEach((rowComments, rowOffset) => {
          rowComments.forEach((comment, colOffset) => {
            const row = target.startRow + rowOffset;
            const col = target.startCol + colOffset;

            if (comment) {
              comments.setCommentAtCell(row, col, comment);
            } else {
              comments.removeCommentAtCell(row, col, false);
            }
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
