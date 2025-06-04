/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-layout-direction',
  standalone: false,
  template: ` <section dir="rtl">
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  </section>`,
})
export class Example2LayoutDirectionComponent {

  data = [
    ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
    ['2019', 10, 11, 12, 13],
    ['2020', 20, 11, 14, 13],
    ['2021', 30, 15, 12, 13],
  ];

  readonly gridSettings: GridSettings = {
    autoWrapRow: true,
    autoWrapCol: true,
    colHeaders: true,
    rowHeaders: true,
    height: 'auto',
    layoutDirection: 'inherit'
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
import { Example2LayoutDirectionComponent } from './app.component';
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
  declarations: [ Example2LayoutDirectionComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example2LayoutDirectionComponent ]
})

export class AppModule { }
/* end-file */
