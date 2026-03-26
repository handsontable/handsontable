/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';
import { HyperFormula } from 'hyperformula';

// Named expressions Q1_TOTAL and Q2_TOTAL reference absolute column ranges.
// The sheet name 'Sheet1' matches the default sheetName for this instance.
@Component({
  selector: 'app-example4',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
})
export class AppComponent {
  readonly hotData = [
    ['Widget A', 200, 250],
    ['Widget B', 150, 300],
    ['Widget C', 400, 350],
    ['Totals', '=Q1_TOTAL', '=Q2_TOTAL'],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: ['Product', 'Q1 Sales', 'Q2 Sales'],
    rowHeaders: true,
    height: 'auto',
    formulas: {
      engine: HyperFormula,
      namedExpressions: [
        {
          name: 'Q1_TOTAL',
          expression: '=SUM(Sheet1!$B$1:Sheet1!$B$3)',
        },
        {
          name: 'Q2_TOTAL',
          expression: '=SUM(Sheet1!$C$1:Sheet1!$C$3)',
        },
      ],
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
