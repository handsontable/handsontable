/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example-installation',
  standalone: true,
  imports: [HotTableModule],
  template: `<div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class AppComponent {

  readonly data = [
    ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
    ['2019', 10, 11, 12, 13],
    ['2020', 20, 11, 14, 13],
    ['2021', 30, 15, 12, 13],
    ['2022', 25, 20, 11, 14],
  ];
  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: true,
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
import { registerLanguageDictionary, enUS } from "handsontable/i18n";

registerLanguageDictionary(enUS);
registerAllModules();

const globalHotConfig: HotGlobalConfig = {
  license: NON_COMMERCIAL_LICENSE,
  layoutDirection: "ltr",
  language: enUS.languageCode,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: HOT_GLOBAL_CONFIG, useValue: globalHotConfig },
  ],
};

/* end-file */
