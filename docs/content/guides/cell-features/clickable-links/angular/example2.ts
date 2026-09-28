/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-clickable-links',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {
  readonly data = [
    ['Update API docs', 'https://tracker.example.com/tasks/4821', 'mailto:ana.garcia@example.com', 'Draft at https://wiki.example.com/api-docs'],
    ['Deploy hotfix', 'https://tracker.example.com/tasks/4830', 'mailto:james.okafor@example.com', 'Rollback plan: https://wiki.example.com/rollback'],
    ['Migrate CI runners', 'https://tracker.example.com/tasks/4835', 'tel:+48123456789', 'Blocked on vendor call.'],
    ['Renew TLS certificates', 'https://tracker.example.com/tasks/4841', 'mailto:priya.nair@example.com', 'See https://wiki.example.com/tls'],
    ['Audit access logs', 'https://tracker.example.com/tasks/4846', 'tel:+48987654321', 'Report due 2025-06-30.'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Task', 'Tracker', 'Contact', 'Notes'],
    colWidths: [180, 260, 220, 320],
    height: 'auto',
    // Open links in the same tab, link web URLs only, and add a class to every link.
    autoLink: {
      target: '_self',
      schemes: ['http', 'https'],
      className: 'tracker-link',
    },
    columns: [
      {},
      // Link only a cell whose whole value is a URL.
      { autoLink: { inline: false } },
      // Keep the contact column as plain text.
      { autoLink: false },
      {},
    ],
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
