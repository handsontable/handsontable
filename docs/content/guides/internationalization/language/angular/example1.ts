/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';
import { deDE, registerLanguageDictionary } from 'handsontable/i18n';

registerLanguageDictionary(deDE);

@Component({
  selector: 'example1-language',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1LanguageComponent {

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


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example1LanguageComponent } from './app.component';
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
  declarations: [ Example1LanguageComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1LanguageComponent ]
})

export class AppModule { }
/* end-file */
