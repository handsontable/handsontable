/* file: app.component.ts */
import { Component } from '@angular/core';
import {
  registerLanguageDictionary,
  getLanguagesDictionaries,
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
  zhTW
} from 'handsontable/i18n';
import Handsontable from 'handsontable/base';

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
  selector: 'app-root',
  template: `
    <div class="controls select-language"><label>Select language of the context menu:
    <select [(ngModel)]="language">
      <option *ngFor="let l of languages" [value]="l.languageCode">{{l.languageCode}}</option>
    </select></label></div>
    <div>
      <hot-table [language]="language" [settings]="hotSettings"></hot-table>
    </div>
  `,
})

export class AppComponent {
  hotSettings: Handsontable.GridSettings = {
    data: [
      ['A1', 'B1', 'C1', 'D1', 'E1'],
      ['A2', 'B2', 'C2', 'D2', 'E2'],
      ['A3', 'B3', 'C3', 'D3', 'E3'],
      ['A4', 'B4', 'C4', 'D4', 'E4'],
      ['A5', 'B5', 'C5', 'D5', 'E5'],
    ],
    colHeaders: true,
    rowHeaders: true,
    contextMenu: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation'
  };
  language = 'en-US';
  languages = getLanguagesDictionaries();
}
/* end-file */

/* file: app.module.ts */
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';
import { registerAllModules } from 'handsontable/registry';
/* start:skip-in-compilation */
import { AppComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

@NgModule({
  imports: [ BrowserModule, FormsModule, HotTableModule ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
