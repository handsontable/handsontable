/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from "@handsontable/angular-wrapper";

@Component({
  selector: 'app-example1',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
})
export class AppComponent {

  // generate an array of arrays with dummy data
  readonly hotData = new Array(1000) // number of rows
    .fill(null)
    .map((_, row) =>
      new Array(1000) // number of columns
        .fill(null)
        .map((_v, column) => `${row}, ${column}`)
    );

  readonly hotSettings: GridSettings = {
    colWidths: 100,
    width: '100%',
    height: 320,
    rowHeaders: true,
    colHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
  };
}
/* end-file */


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

/* start:skip-in-compilation */
import { AppComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: 'ht-theme-main-dark-auto',
        license: NON_COMMERCIAL_LICENSE,
      } as HotConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ AppComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
