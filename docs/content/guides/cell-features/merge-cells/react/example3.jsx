import { useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const [output, setOutput] = useState('');

  const logEvent = (message) => {
    setOutput((previousOutput) => `${message}\n${previousOutput}`);
  };

  return (
    <>
      <output className="console" id="example3-output">
        {output ||
          'Select cells, then press Ctrl+M (or use the context menu) to merge or unmerge them. Hook activity appears here.'}
      </output>
      <HotTable
        data={[
          ['North America', 420000, 465000, 501000],
          ['Europe', 388000, 402000, 411000],
          ['APAC', 275000, 298000, 312000],
          ['Latin America', 142000, 151000, 158000],
          ['Middle East', 96000, 101000, 108000],
        ]}
        colHeaders={['Region', 'Jan 2025', 'Feb 2025', 'Mar 2025']}
        rowHeaders={true}
        height="auto"
        contextMenu={true}
        mergeCells={true}
        autoWrapRow={true}
        autoWrapCol={true}
        beforeMergeCells={(cellRange) => {
          logEvent(`beforeMergeCells: rows ${cellRange.from.row}-${cellRange.to.row}, columns ${cellRange.from.col}-${cellRange.to.col}.`);
        }}
        afterMergeCells={(cellRange, mergeParent) => {
          logEvent(`afterMergeCells: merged into ${mergeParent.rowspan} row(s) by ${mergeParent.colspan} column(s).`);
        }}
        beforeUnmergeCells={(cellRange) => {
          logEvent(`beforeUnmergeCells: rows ${cellRange.from.row}-${cellRange.to.row}, columns ${cellRange.from.col}-${cellRange.to.col}.`);
        }}
        afterUnmergeCells={(cellRange) => {
          logEvent(`afterUnmergeCells: rows ${cellRange.from.row}-${cellRange.to.row}, columns ${cellRange.from.col}-${cellRange.to.col}.`);
        }}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
