/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example6-comments',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div class="example-controls-container">
      <div class="controls">
        <button id="list-comments" (click)="listComments()">List all comments</button>
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
    <output class="comments-output" style="white-space: pre-wrap">{{ output }}</output>`,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = [
    ['Update API docs', 'Ana García', 'In progress'],
    ['Deploy hotfix', 'James Okafor', 'Blocked'],
    ['Review pull requests', 'Li Wei', 'Done'],
    ['Plan Q3 roadmap', 'Maria Santos', 'In progress'],
    ['Refactor auth module', 'David Kim', 'In review'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Task', 'Assignee', 'Status'],
    rowHeaders: true,
    comments: true,
    cell: [
      { row: 1, col: 2, comment: { value: 'Waiting on infrastructure approval.' } },
      { row: 3, col: 1, comment: { value: 'Reassign if capacity is tight.' } },
      { row: 4, col: 0, comment: { value: 'Blocked on the security review.' } },
    ],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
  };

  output = '';

  listComments(): void {
    const hot = this.hotTable?.hotInstance;

    if (!hot) {
      return;
    }

    const found: string[] = [];

    // `getCellMetaAtRow()` takes a physical row index (equal to the visual index here, with no sorting or trimming).
    for (let row = 0; row < hot.countRows(); row += 1) {
      hot.getCellMetaAtRow(row).forEach((cellMeta, col) => {
        const comment = cellMeta['comment'] as { value?: string } | undefined;

        if (comment?.value !== undefined) {
          found.push(`Row ${row + 1}, "${hot.getColHeader(col)}": ${comment.value}`);
        }
      });
    }

    this.output = found.length > 0 ? found.join('\n') : 'No comments found.';
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
