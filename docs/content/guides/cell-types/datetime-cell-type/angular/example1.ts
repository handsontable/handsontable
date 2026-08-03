/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-datetime-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  readonly data = [
    { task: 'Design review', deadline: '2024-03-15T09:30:00', created: '2024-03-01T08:00:00' },
    { task: 'Sprint demo', deadline: '2024-03-16 14:00:00', created: '2024-03-02T11:20:00' },
    { task: 'Release', deadline: '2024-03-20T23:59:59', created: '2024-03-05T16:45:00' },
    { task: 'Retro', deadline: '2024-03-22', created: '2024-03-06T09:00:00' },
    { task: 'Planning', deadline: '2024-03-25T10:15:00', created: '2024-03-08T13:30:00' },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Task', 'Deadline', 'Created'],
    columns: [
      { type: 'text', data: 'task' },
      {
        type: 'intl-datetime',
        data: 'deadline',
        locale: 'en-US',
        dateTimeFormat: { dateStyle: 'medium', timeStyle: 'short' },
      },
      {
        type: 'intl-datetime',
        data: 'created',
        locale: 'en-US',
        dateTimeFormat: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        },
      },
    ],
    columnSorting: true,
    filters: true,
    dropdownMenu: true,
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

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig },
  ],
};
/* end-file */
