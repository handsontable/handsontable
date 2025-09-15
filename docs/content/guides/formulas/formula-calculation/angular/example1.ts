/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';
import {HyperFormula} from 'hyperformula';

@Component({
  selector: 'app-example1',
  template: `
    <h3 class="demo-preview">Sheet 1</h3>
    <hot-table
      [settings]="hotSettings1!" [data]="hotData1">
    </hot-table>

    <h3 class="demo-preview">Sheet 2</h3>
    <hot-table
      [settings]="hotSettings2!" [data]="hotData2">
    </hot-table>
  `,
  styles: `
    h3.demo-preview {
      margin-bottom: 0.3rem !important;
      padding-top: 0 !important;
      margin-top: 0.5rem !important;
    }
  `,
  standalone: false
})
export class AppComponent {

  // create an external HyperFormula instance
  readonly hyperformulaInstance = HyperFormula.buildEmpty({
    // to use an external HyperFormula instance,
    // initialize it with the `'internal-use-in-handsontable'` license key
    licenseKey: 'internal-use-in-handsontable',
  });

  readonly hotData1 = [
    ['10.26', null, 'Sum', '=SUM(A:A)'],
    ['20.12', null, 'Average', '=AVERAGE(A:A)'],
    ['30.01', null, 'Median', '=MEDIAN(A:A)'],
    ['40.29', null, 'MAX', '=MAX(A:A)'],
    ['50.18', null, 'MIN', '=MIN(A1:A5)'],
  ];

  readonly hotSettings1: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    height: 'auto',
    formulas: {
      engine: this.hyperformulaInstance,
      sheetName: 'Sheet1',
    },
    autoWrapRow: true,
    autoWrapCol: true,
  };


  readonly hotData2 = [
    ['Is A1 in Sheet1 > 10?', '=IF(Sheet1!A1>10,"TRUE","FALSE")'],
    ['Is A:A in Sheet > 150?', '=IF(SUM(Sheet1!A:A)>150,"TRUE","FALSE")'],
    ['How many blank cells are in the Sheet1?', '=COUNTBLANK(Sheet1!A1:D5)'],
    ['Generate a random number', '=RAND()'],
    ['Number of sheets in this workbook', '=SHEETS()'],
  ];

  readonly hotSettings2: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    height: 'auto',
    formulas: {
      engine: this.hyperformulaInstance,
      sheetName: 'Sheet2',
    },
    autoWrapRow: true,
    autoWrapCol: true,
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
