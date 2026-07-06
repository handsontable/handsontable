import { useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
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
  // `data` is kept in state (instead of loaded imperatively) so a `status` update doesn't
  // make HotTable re-apply the original `data` prop and undo the sort.
  const [gridData, setGridData] = useState(data);
  const [status, setStatus] = useState('Click a column header to sort.');

  // Canceling the front-end sort also stops Handsontable from tracking the column's sort
  // order, so this example cycles ascending -> descending -> unsorted manually.
  const activeSortRef = useRef<{ column: number; sortOrder: 'asc' | 'desc' } | null>(null);

  const getNextSortOrder = (column: number): 'asc' | 'desc' | null => {
    const activeSort = activeSortRef.current;

    if (!activeSort || activeSort.column !== column) {
      return 'asc';
    }

    return activeSort.sortOrder === 'asc' ? 'desc' : null;
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <span>{status}</span>
        </div>
      </div>
      <HotTable
        data={gridData}
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
          const [requestedSort] = destinationSortConfigs;

          if (!requestedSort) {
            // the sorting was cleared programmatically, restore the original row order
            activeSortRef.current = null;
            setGridData(data);

            return false;
          }

          const nextOrder = getNextSortOrder(requestedSort.column);

          if (nextOrder === null) {
            activeSortRef.current = null;
            setStatus('Cleared the sort.');
            setGridData(data);

            return false;
          }

          activeSortRef.current = { column: requestedSort.column, sortOrder: nextOrder };
          setStatus('Sorting on the server...');

          sortOnServer(columnDataKeys[requestedSort.column], nextOrder).then((sortedData) => {
            setGridData(sortedData);
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
