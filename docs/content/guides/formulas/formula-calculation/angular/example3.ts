/* file: app.component.ts */
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import {GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {HyperFormula} from 'hyperformula';

@Component({
  standalone: true,
  imports: [HotTableModule, ReactiveFormsModule],
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

    (formulasPlugin.engine as any)?.changeNamedExpression('ADDITIONAL_COST', this.namedExpressionsControl.value);
    this.hotTable.hotInstance!.render();
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
