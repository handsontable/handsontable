/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';
import { FunctionArgumentType, FunctionPlugin, HyperFormula } from 'hyperformula';
import type { ProcedureAst } from 'hyperformula/typings/parser/Ast';
import type { InterpreterState } from 'hyperformula/typings/interpreter/InterpreterState';
import type { InterpreterValue } from 'hyperformula/typings/interpreter/InterpreterValue';

class CommissionPlugin extends FunctionPlugin {
  commission(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('COMMISSION'),
      (revenue: number, rate: number): number => revenue * (rate / 100),
    );
  }
}

CommissionPlugin.implementedFunctions = {
  COMMISSION: {
    method: 'commission',
    parameters: [
      { argumentType: FunctionArgumentType.NUMBER },
      { argumentType: FunctionArgumentType.NUMBER },
    ],
  },
};

HyperFormula.registerFunctionPlugin(CommissionPlugin, {
  enGB: { COMMISSION: 'COMMISSION' },
});

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example5',
  template: `
    <hot-table [settings]="gridSettings" [data]="data"></hot-table>
  `,
})
export class AppComponent {
  readonly data: (string | number)[][] = [
    ['Sales rep', 'Revenue (USD)', 'Commission rate (%)', 'Commission amount (USD)'],
    ['Ana García', 45000, 8, '=COMMISSION(B2,C2)'],
    ['James Okafor', 62000, 10, '=COMMISSION(B3,C3)'],
    ['Li Wei', 38000, 8, '=COMMISSION(B4,C4)'],
    ['Maria Santos', 71000, 12, '=COMMISSION(B5,C5)'],
    ['David Kim', 29000, 7, '=COMMISSION(B6,C6)'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    height: 'auto',
    formulas: { engine: HyperFormula },
    autoWrapRow: true,
    autoWrapCol: true,
  };
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
