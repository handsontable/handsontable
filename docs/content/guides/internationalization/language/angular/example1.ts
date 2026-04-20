/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';
import { deDE, registerLanguageDictionary } from 'handsontable/i18n';

registerLanguageDictionary(deDE);

@Component({
  selector: 'example1-language',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data: Array<Array<string | number>> = [
    ['Lorem', 'ipsum', 'dolor', 'sit', '12/1/2015', 23],
    ['adipiscing', 'elit', 'Ut', 'imperdiet', '5/12/2015', 6],
    ['Pellentesque', 'vulputate', 'leo', 'semper', '10/23/2015', 26],
    ['diam', 'et', 'malesuada', 'libero', '12/1/2014', 98],
    ['orci', 'et', 'dignissim', 'hendrerit', '12/1/2016', 8.5],
  ];

  readonly gridSettings: GridSettings = {
    contextMenu: true,
    height: 'auto',
    language: 'de-DE',
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
