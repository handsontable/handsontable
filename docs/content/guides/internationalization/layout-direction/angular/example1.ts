/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

// @ts-ignore
import { arAR, registerLanguageDictionary } from 'handsontable/i18n';

registerLanguageDictionary(arAR);

@Component({
  selector: 'example1-layout-direction',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = this.generateArabicData();
  readonly gridSettings: GridSettings = {
    autoWrapRow: true,
    autoWrapCol: true,
    colHeaders: true,
    rowHeaders: true,
    height: 'auto',
    layoutDirection: 'rtl',
    language: 'ar-AR',
    dropdownMenu: true,
    filter: true,
    contextMenu: true
  };

  //  generate random RTL data (e.g., Arabic)
  private generateArabicData(): any[][] {
    const randomName = () =>
      ['عمر', 'علي', 'عبد الله', 'معتصم'][Math.floor(Math.random() * 3)];

    const randomCountry = () =>
      ['تركيا', 'مصر', 'لبنان', 'العراق'][Math.floor(Math.random() * 3)];

    const randomDate = () =>
      new Date(Math.floor(Math.random() * Date.now())).toLocaleDateString();

    const randomBool = () => Math.random() > 0.5;
    const randomNumber = (a = 0, b = 1000) => a + Math.floor(Math.random() * b);
    const randomPhrase = () =>
      `${randomCountry()} ${randomName()} ${randomNumber()}`;

    const arr = Array.from({ length: 10 }, () => [
      randomBool(),
      randomName(),
      randomCountry(),
      randomPhrase(),
      randomDate(),
      randomPhrase(),
      randomBool(),
      randomNumber(0, 200).toString(),
      randomNumber(0, 10),
      randomNumber(0, 5),
    ]);

    return arr;
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
