import { ChangeEvent, useRef, useState } from 'react';
import { HyperFormula } from 'hyperformula';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { DetailedSettings } from 'handsontable/plugins/formulas';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotNamedExpressionsRef = useRef<HotTableRef>(null);
  const [namedExpressionValue, setNamedExpressionValue] =
    useState('=10 * Sheet1!$A$2');

  const data = [
    ['Travel ID', 'Destination', 'Base price', 'Price with extra cost'],
    ['154', 'Rome', 400, '=ROUND(ADDITIONAL_COST+C2,0)'],
    ['155', 'Athens', 300, '=ROUND(ADDITIONAL_COST+C3,0)'],
    ['156', 'Warsaw', 150, '=ROUND(ADDITIONAL_COST+C4,0)'],
  ];

  const inputChangeCallback = (event: ChangeEvent<HTMLInputElement>) => {
    setNamedExpressionValue(event.target.value);
  };

  const buttonClickCallback = () => {
    const hotNamedExpressions = hotNamedExpressionsRef.current?.hotInstance;
    const formulasPlugin = hotNamedExpressions?.getPlugin('formulas');

    formulasPlugin?.engine?.changeNamedExpression(
      'ADDITIONAL_COST',
      namedExpressionValue
    );

    hotNamedExpressions?.render();
  };

  return (
    <>
      <HotTable
        ref={hotNamedExpressionsRef}
        data={data}
        colHeaders={true}
        rowHeaders={true}
        height="auto"
        formulas={
          {
            engine: HyperFormula,
            namedExpressions: [
              {
                name: 'ADDITIONAL_COST',
                expression: 100,
              },
            ],
          } as DetailedSettings
        }
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <input
          id="named-expressions-input"
          type="text"
          defaultValue={namedExpressionValue}
          onChange={(...args) => inputChangeCallback(...args)}
        />
        <button
          id="named-expressions-button"
          onClick={() => buttonClickCallback()}
        >
          Calculate the price
        </button>
      </div>
    </>
  );
};

export default ExampleComponent;
