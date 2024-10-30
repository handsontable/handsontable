import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { data } from './data';

import 'handsontable/dist/handsontable.full.min.css';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const App = () => {
  return (
    <HotTable
      data={data}
      colHeaders={[
        'ID',
        'Item Name',
        'Item No.',
        'Lead Engineer',
        'Cost',
        'Supplier Name',
        'Restock Date',
        'Operational Status',
        'Origin',
        'Quantity',
        'Value Stock',
        'Repairable',
      ]}
      rowHeaders={true}
      height={340}
      width={800}
      autoWrapRow={true}
      autoWrapCol={true}
      dropdownMenu={true}
      filters={true}
      multiColumnSorting={true}
      hiddenColumns={{
        columns: [0, 2], // Hides the ID and Item No. columns
        indicators: true,
      }}
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data='id' type='numeric' width={150} />
      <HotColumn data='itemName' type='text' className='htLeft' width={150} />
      <HotColumn data='itemNo' type='text' className='htLeft' width={150} />
      <HotColumn
        data='leadEngineer'
        type='text'
        className='htLeft'
        width={150}
      />
      <HotColumn data='cost' type='numeric' />
      <HotColumn
        data='supplierName'
        type='text'
        className='htLeft'
        width={150}
      />
      <HotColumn
        data='restockDate'
        type='date'
        className='htCenter'
        width={150}
      />
      <HotColumn
        data='operationalStatus'
        type='text'
        className='htCenter'
        width={150}
      />
      <HotColumn data='origin' type='text' className='htLeft' width={150} />
      <HotColumn
        data='quantity'
        type='numeric'
        className='htRight'
        width={150}
      />
      <HotColumn
        data='valueStock'
        type='numeric'
        numericFormat={{ pattern: '$0 0' }}
        className='htRight'
        width={150}
      />
      <HotColumn
        data='repairable'
        type='checkbox'
        className='htCenter'
        width={100}
      />
    </HotTable>
  );
};

const container = document.getElementById('container');
if (container) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  console.error('Failed to find the container element.');
}
