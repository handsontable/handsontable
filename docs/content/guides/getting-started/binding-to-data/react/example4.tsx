import { FC } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

interface Person {
  id: number;
  name?: { first: string; last: string };
  address: string;
}

const ExampleComponent: FC = () => {
  const data: Person[] = [
    { id: 1, name: { first: 'Ted', last: 'Right' }, address: '' },
    { id: 2, address: '' }, // Handsontable will create missing properties on demand
    { id: 3, name: { first: 'Joan', last: 'Well' }, address: '' },
  ];

  return (
    <HotTable
      data={data}
      colHeaders={true}
      height="auto"
      width="auto"
      columns={(column) => {
        let columnMeta = {};

        if (column === 0) {
          columnMeta.data = 'id';
        } else if (column === 1) {
          columnMeta.data = 'name.first';
        } else if (column === 2) {
          columnMeta.data = 'name.last';
        } else if (column === 3) {
          columnMeta.data = 'address';
        } else {
          columnMeta = {};
        }

        return columnMeta;
      }}
      minSpareRows={1}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
