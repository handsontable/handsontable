/* file: app.component.ts */
import {Component, ViewChild, ViewEncapsulation} from '@angular/core';
import {GridSettings, HotTableComponent} from '@handsontable/angular-wrapper';
import {FormControl} from '@angular/forms';
import {HyperFormula} from 'hyperformula';

@Component({
  selector: 'app-example3',
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <input [formControl]="namedExpressionsControl" type="text" />&nbsp;
        <button (click)="applyNamedExpression()">Calculate the price</button>
      </div>
    </div>

    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  encapsulation: ViewEncapsulation.None,
  standalone: false
})
export class AppComponent {
  @ViewChild(HotTableComponent, {static: false}) hotTable!: HotTableComponent;

  namedExpressionsControl = new FormControl('=10 * Sheet1!$A$2');

  readonly hotData = [
    ['Travel ID', 'Destination', 'Base price', 'Price with extra cost'],
    ['154', 'Rome', 400, '=ROUND(ADDITIONAL_COST+C2,0)'],
    ['155', 'Athens', 300, '=ROUND(ADDITIONAL_COST+C3,0)'],
    ['156', 'Warsaw', 150, '=ROUND(ADDITIONAL_COST+C4,0)'],
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    height: 'auto',
    formulas: {
      engine: HyperFormula,
      namedExpressions: [
        {
          name: 'ADDITIONAL_COST',
          expression: 100,
        },
      ],
    },
    autoWrapRow: true,
    autoWrapCol: true,
  };

  applyNamedExpression() {
    const formulasPlugin = this.hotTable.hotInstance!.getPlugin('formulas');

    formulasPlugin.engine?.changeNamedExpression('ADDITIONAL_COST', this.namedExpressionsControl.value);
    this.hotTable.hotInstance!.render();
  }
}
/* end-file */


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
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
  imports: [ BrowserModule, HotTableModule, CommonModule, ReactiveFormsModule ],
  declarations: [ AppComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
