import { useRef, useState } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  { brand: 'Jetpulse', model: 'Racing Socks', price: 30, sellDate: '2023-10-11' },
  { brand: 'Gigabox', model: 'HL Mountain Frame', price: 1890.9, sellDate: '2023-05-03' },
  { brand: 'Camido', model: 'Cycling Cap', price: 130.1, sellDate: '2023-03-27' },
  { brand: 'Chatterpoint', model: 'Road Tire Tube', price: 59, sellDate: '2023-08-28' },
  { brand: 'Eidel', model: 'HL Road Tire', price: 279.99, sellDate: '2023-10-02' },
];

const columnDataKeys = ['brand', 'model', 'price', 'sellDate'];

// Simulates a server that receives a sort request and returns sorted rows.
function sortOnServer(columnKey: string, sortOrder: string) {
  return new Promise<typeof data>((resolve) => {
    setTimeout(() => {
      const sortedData = [...data].sort((rowA: any, rowB: any) => {
        if (rowA[columnKey] === rowB[columnKey]) {
          return 0;
        }

        return (rowA[columnKey] > rowB[columnKey]) === (sortOrder === 'asc') ? 1 : -1;
      });

      resolve(sortedData);
    }, 600);
  });
}

const ExampleComponent = () => {
  const hotTableComponentRef = useRef<HotTableRef>(null);
  const [status, setStatus] = useState('Click a column header to sort.');

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <span>{status}</span>
        </div>
      </div>
      <HotTable
        ref={hotTableComponentRef}
        data={data}
        columns={[
          { title: 'Brand', type: 'text', data: 'brand' },
          { title: 'Model', type: 'text', data: 'model' },
          {
            title: 'Price',
            type: 'numeric',
            data: 'price',
            locale: 'en-US',
            numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
          },
          {
            title: 'Date',
            type: 'intl-date',
            data: 'sellDate',
            locale: 'en-US',
            dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
            className: 'htRight',
          },
        ]}
        columnSorting={true}
        beforeColumnSort={(currentSortConfig, destinationSortConfigs) => {
          const [sortConfig] = destinationSortConfigs;

          if (!sortConfig || sortConfig.sortOrder === 'none') {
            return true;
          }

          setStatus('Sorting on the server...');

          sortOnServer(columnDataKeys[sortConfig.column], sortConfig.sortOrder).then((sortedData) => {
            hotTableComponentRef.current?.hotInstance?.loadData(sortedData);
            setStatus('Sorted on the server.');
          });

          // return `false` to cancel Handsontable's own front-end sort
          return false;
        }}
        height="auto"
        stretchH="all"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
