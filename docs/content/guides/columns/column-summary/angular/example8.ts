/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example8',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
})
export class AppComponent {

  readonly hotData = [[0, 1, 2], ['3c', '4b', 5], [], []];

  readonly hotSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    columnSummary: [
      {
        type: 'sum',
        destinationRow: 0,
        destinationColumn: 0,
        reversedRowCoords: true,
        // enable throwing data type errors for this column summary
        suppressDataTypeErrors: false,
      },
      {
        type: 'sum',
        destinationRow: 0,
        destinationColumn: 1,
        reversedRowCoords: true,
        // enable throwing data type errors for this column summary
        suppressDataTypeErrors: false,
      },
    ],
    autoWrapRow: true,
    autoWrapCol: true,
    height: 'auto',
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
import { AppComponent } from './app.component';
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
  declarations: [ AppComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
