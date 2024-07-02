import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

interface Person {
  id: number;
  name: string;
  address: string;
}

const data: Person[] = [
  { id: 1, name: 'Ted Right', address: '' },
  { id: 2, name: 'Frank Honest', address: '' },
  { id: 3, name: 'Joan Well', address: '' },
  { id: 4, name: 'Gail Polite', address: '' },
  { id: 5, name: 'Michael Fair', address: '' },
];

const ExampleComponent: React.FC = () => (
  <HotTable
    data={data}
    colHeaders={true}
    height="auto"
    width="auto"
    minSpareRows={1}
    autoWrapRow={true}
    autoWrapCol={true}
    licenseKey="non-commercial-and-evaluation"
  />
);

export default ExampleComponent;
