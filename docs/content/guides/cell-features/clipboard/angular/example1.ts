/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-clipboard',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    ['Update API docs',  'Backend', 'In progress', 'Ana García',      '2026-05-10'],
    ['Deploy hotfix',    'DevOps',  'Done',         'David Kim',       '2026-04-02'],
    ['Write tests',      'QA',      'Blocked',      'Sara Johansson',  '2026-05-20'],
    ['Review PRs',       'Backend', 'In progress',  'Li Wei',          '2026-04-15'],
    ['Update README',    'Docs',    'Done',          'Emma Wilson',     '2026-03-28'],
  ];

  readonly gridSettings: GridSettings ={
    rowHeaders: true,
    colHeaders: true,
    contextMenu: ['copy', 'cut'],
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
