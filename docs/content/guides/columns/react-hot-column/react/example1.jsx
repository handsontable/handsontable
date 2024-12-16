import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const hotData = [
  ['A1', 'B1'],
  ['A2', 'B2'],
  ['A3', 'B3'],
  ['A4', 'B4'],
  ['A5', 'B5'],
  ['A6', 'B6'],
  ['A7', 'B7'],
  ['A8', 'B8'],
  ['A9', 'B9'],
  ['A10', 'B10'],
];

const secondColumnSettings = {
  title: 'Second column header',
  readOnly: true,
};

const ExampleComponent = () => {
  return (
    <HotTable
      data={hotData}
      autoWrapRow={true}
      autoWrapCol={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn title="First column header" />
      <HotColumn settings={secondColumnSettings} />
    </HotTable>
  );
};

export default ExampleComponent;
