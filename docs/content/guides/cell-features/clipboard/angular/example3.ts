/* file: app.component.ts */
import {Component, ViewChild, ViewEncapsulation} from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example3-clipboard',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button
          id="copy"
          (mousedown)="copyBtnMousedown()"
          (click)="copyBtnClick()"
        >
          Select and copy cell B2
        </button>&nbsp;
        <button id="cut" (mousedown)="cutBtnMousedown()" (click)="cutBtnClick()">
          Select and cut cell B2
        </button>
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`
  ,
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly data = [
    ['Update API docs',  'Backend', 'In progress', 'Ana García',      '2026-05-10'],
    ['Deploy hotfix',    'DevOps',  'Done',         'David Kim',       '2026-04-02'],
    ['Write tests',      'QA',      'Blocked',      'Sara Johansson',  '2026-05-20'],
    ['Review PRs',       'Backend', 'In progress',  'Li Wei',          '2026-04-15'],
    ['Update README',    'Docs',    'Done',          'Emma Wilson',     '2026-03-28'],
  ];

  readonly gridSettings:GridSettings = {
    rowHeaders: true,
    colHeaders: true,
    outsideClickDeselects: false,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
  };

  copyBtnClick(): void {
    document.execCommand('copy');
  }

  cutBtnClick(): void {
    document.execCommand('cut');
  }

  copyBtnMousedown(): void {
    const hot = this.hotTable?.hotInstance;

    hot?.selectCell(1, 1);
  }

  cutBtnMousedown(): void {
    const hot = this.hotTable?.hotInstance;

    hot?.selectCell(1, 1);
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
