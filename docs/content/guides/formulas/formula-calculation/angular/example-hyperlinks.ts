/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import { HyperFormula } from 'hyperformula';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example-hyperlinks',
  template: `
    <hot-table [settings]="gridSettings" [data]="data"></hot-table>
  `,
})
export class AppComponent {
  readonly data: string[][] = [
    ['Acme Corp', '=HYPERLINK("https://example.com/acme", "acme.example.com")'],
    ['Vertex Industries', '=HYPERLINK("https://example.com/vertex", "vertex.example.com")'],
    ['Harbor Goods', '=HYPERLINK("https://example.com/harbor", "harbor.example.com")'],
    ['Alpine Supply Co.', '=HYPERLINK("https://example.com/alpine", "alpine.example.com")'],
    ['Summit Logistics', '=HYPERLINK("https://example.com/summit", "summit.example.com")'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Company', 'Website'],
    rowHeaders: true,
    height: 'auto',
    colWidths: [180, 220],
    formulas: { engine: HyperFormula, hyperlinks: true },
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
