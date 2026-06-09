import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13],
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      minSpareRows={1}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
