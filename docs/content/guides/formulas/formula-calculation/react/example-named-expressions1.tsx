import { ChangeEvent, useRef, useState } from 'react';
import { HyperFormula } from 'hyperformula';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { DetailedSettings } from 'handsontable/plugins/formulas';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotNamedExpressionsRef = useRef<HotTableRef>(null);
  const [namedExpressionValue, setNamedExpressionValue] = useState('=10 * Sheet1!$A$2');
  const [errorMessage, setErrorMessage] = useState('');

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

    try {
      formulasPlugin?.engine?.changeNamedExpression('ADDITIONAL_COST', namedExpressionValue);
    } catch (error) {
      // HyperFormula rejects some expressions, for example relative references such as `Sheet1!A2`.
      setErrorMessage(error instanceof Error ? error.message : String(error));

      return;
    }

    setErrorMessage('');
    hotNamedExpressions?.render();
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <input
            id="named-expressions-input"
            type="text"
            defaultValue={namedExpressionValue}
            onChange={(...args) => inputChangeCallback(...args)}
          />
          <button id="named-expressions-button" onClick={() => buttonClickCallback()}>
            Calculate the price
          </button>
        </div>
        <output className={errorMessage ? 'is-error' : undefined}>{errorMessage}</output>
      </div>
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
    </>
  );
};

export default ExampleComponent;
