import { HyperFormula } from 'hyperformula';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const data1 = [
    ['10.26', null, 'Sum', '=SUM(A:A)'],
    ['20.12', null, 'Average', '=AVERAGE(A:A)'],
    ['30.01', null, 'Median', '=MEDIAN(A:A)'],
    ['40.29', null, 'MAX', '=MAX(A:A)'],
    ['50.18', null, 'MIN', '=MIN(A1:A5)'],
  ];

  const data2 = [
    ['Is A1 in Sheet1 > 10?', '=IF(Sheet1!A1>10,"TRUE","FALSE")'],
    ['Is A:A in Sheet > 150?', '=IF(SUM(Sheet1!A:A)>150,"TRUE","FALSE")'],
    ['How many blank cells are in the Sheet1?', '=COUNTBLANK(Sheet1!A1:D5)'],
    ['Generate a random number', '=RAND()'],
    ['Number of sheets in this workbook', '=SHEETS()'],
  ];

  //  create an external HyperFormula instance
  const hyperformulaInstance = HyperFormula.buildEmpty({
    // to use an external HyperFormula instance,
    // initialize it with the `'internal-use-in-handsontable'` license key
    licenseKey: 'internal-use-in-handsontable',
  });

  return (
    <>
      <h3 className="demo-preview">Sheet 1</h3>
      <HotTable
        data={data1}
        colHeaders={true}
        rowHeaders={true}
        height="auto"
        formulas={{
          engine: hyperformulaInstance,
          sheetName: 'Sheet1',
        }}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
      <h3 className="demo-preview">Sheet 2</h3>
      <HotTable
        data={data2}
        colHeaders={true}
        rowHeaders={true}
        height="auto"
        formulas={{
          engine: hyperformulaInstance,
          sheetName: 'Sheet2',
        }}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
