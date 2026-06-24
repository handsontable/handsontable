import { FunctionArgumentType, FunctionPlugin, HyperFormula } from 'hyperformula';
import type { ProcedureAst } from 'hyperformula/typings/parser/Ast';
import type { InterpreterState } from 'hyperformula/typings/interpreter/InterpreterState';
import type { InterpreterValue } from 'hyperformula/typings/interpreter/InterpreterValue';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type { DetailedSettings } from 'handsontable/plugins/formulas';

// register Handsontable's modules
registerAllModules();

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

const data: (string | number)[][] = [
  ['Sales rep', 'Revenue (USD)', 'Commission rate (%)', 'Commission amount (USD)'],
  ['Ana García', 45000, 8, '=COMMISSION(B2,C2)'],
  ['James Okafor', 62000, 10, '=COMMISSION(B3,C3)'],
  ['Li Wei', 38000, 8, '=COMMISSION(B4,C4)'],
  ['Maria Santos', 71000, 12, '=COMMISSION(B5,C5)'],
  ['David Kim', 29000, 7, '=COMMISSION(B6,C6)'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={true}
      rowHeaders={true}
      height="auto"
      formulas={{ engine: HyperFormula } as DetailedSettings}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
