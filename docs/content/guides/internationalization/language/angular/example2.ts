/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';
import { registerLanguageDictionary, getLanguagesDictionaries,
   // @ts-ignore
  arAR,
  csCZ,
  deCH,
  deDE,
  esMX,
  frFR,
  hrHR,
  itIT,
  jaJP,
  koKR,
  lvLV,
  nbNO,
  nlNL,
  plPL,
  ptBR,
  ruRU,
  srSP,
  zhCN,
  zhTW,
} from 'handsontable/i18n';

registerLanguageDictionary(arAR);
registerLanguageDictionary(csCZ);
registerLanguageDictionary(deCH);
registerLanguageDictionary(deDE);
registerLanguageDictionary(esMX);
registerLanguageDictionary(frFR);
registerLanguageDictionary(hrHR);
registerLanguageDictionary(itIT);
registerLanguageDictionary(jaJP);
registerLanguageDictionary(koKR);
registerLanguageDictionary(lvLV);
registerLanguageDictionary(nbNO);
registerLanguageDictionary(nlNL);
registerLanguageDictionary(plPL);
registerLanguageDictionary(ptBR);
registerLanguageDictionary(ruRU);
registerLanguageDictionary(srSP);
registerLanguageDictionary(zhCN);
registerLanguageDictionary(zhTW);

@Component({
  selector: 'example2-language',
  standalone: false,
  template: ` <div>
    <div class="controls select-language">
      <label>
        Select language of the context menu:
        <select [value]="language" (change)="updateHotLanguage($event)">
          <option *ngFor="let lang of languageList" [value]="lang">
            {{ lang }}
          </option>
        </select>
      </label>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  </div>`,
})
export class Example2LanguageComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data: Array<Array<string | number>> = [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
  ];

  readonly languageList = getLanguagesDictionaries().map(
    (item) => item.languageCode
  );

  language = 'en-US';

  readonly gridSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    contextMenu: true,
    height: 'auto',
    language: this.language,
    autoWrapRow: true,
    autoWrapCol: true
  };

  updateHotLanguage(event: any): void {
    this.language = event.target.value;
    this.hotTable?.hotInstance?.updateSettings({ language: this.language });
  }
}
/* end-file */


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example2LanguageComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: 'ht-theme-main',
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example2LanguageComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example2LanguageComponent ]
})

export class AppModule { }
/* end-file */
