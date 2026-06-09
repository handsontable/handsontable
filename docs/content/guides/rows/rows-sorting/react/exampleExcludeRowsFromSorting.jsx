// you need `useRef` to call Handsontable's instance methods
import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotTableComponentRef = useRef(null);
  const exclude = () => {
    const handsontableInstance = hotTableComponentRef.current?.hotInstance;
    const lastRowIndex = (handsontableInstance?.countRows() || 0) - 1;

    // after each sorting, take row 1 and change its index to 0
    handsontableInstance?.rowIndexMapper.moveIndexes(handsontableInstance.toVisualRow(0), 0);
    // after each sorting, take row 16 and change its index to 15
    handsontableInstance?.rowIndexMapper.moveIndexes(handsontableInstance.toVisualRow(lastRowIndex), lastRowIndex);
  };

  return (
    <HotTable
      ref={hotTableComponentRef}
      data={[
        {
          brand: 'Brand',
          model: 'Model',
          price: 'Price',
          sellDate: 'Date',
          sellTime: 'Time',
          inStock: 'In stock',
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: '2023-05-03',
          sellTime: '11:27',
          inStock: 11,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: '2023-03-27',
          sellTime: '03:17',
          inStock: 0,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '2023-08-28',
          sellTime: '08:01',
          inStock: 1,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '2023-10-02',
          sellTime: '13:23',
          inStock: 3,
        },
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '2023-10-11',
          sellTime: '01:23',
          inStock: 5,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: '2023-05-03',
          sellTime: '11:27',
          inStock: 22,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: '2023-03-27',
          sellTime: '03:17',
          inStock: 13,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '2023-08-28',
          sellTime: '08:01',
          inStock: 0,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          price: 279.99,
          sellDate: '2023-10-02',
          sellTime: '13:23',
          inStock: 14,
        },
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          price: 30,
          sellDate: '2023-10-11',
          sellTime: '01:23',
          inStock: 16,
        },
        {
          brand: 'Gigabox',
          model: 'HL Mountain Frame',
          price: 1890.9,
          sellDate: '2023-05-03',
          sellTime: '11:27',
          inStock: 18,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          price: 130.1,
          sellDate: '2023-03-27',
          sellTime: '03:17',
          inStock: 3,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          price: 59,
          sellDate: '2023-08-28',
          sellTime: '08:01',
          inStock: 0,
        },
        {
          brand: 'Vinte',
          model: 'ML Road Frame-W',
          price: 30,
          sellDate: '2023-10-11',
          sellTime: '01:23',
          inStock: 2,
        },
        {},
      ]}
      columns={[
        {
          type: 'text',
          data: 'brand',
        },
        {
          type: 'text',
          data: 'model',
        },
        {
          type: 'numeric',
          data: 'price',
          locale: 'en-US',
          numericFormat: {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
          },
        },
        {
          type: 'intl-date',
          data: 'sellDate',
          locale: 'en-US',
          dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
          className: 'htRight',
        },
        {
          type: 'intl-time',
          data: 'sellTime',
          locale: 'en-US',
          timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
          className: 'htRight',
        },
        {
          type: 'numeric',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      height={200}
      stretchH="all"
      fixedRowsTop={1}
      fixedRowsBottom={1}
      colHeaders={true}
      columnSorting={true}
      // `afterColumnSort()` is a Handsontable hook: it's fired after each sorting
      afterColumnSort={exclude}
      cells={(row, col, prop) => {
        if (hotTableComponentRef.current != null) {
          const lastRowIndex = (hotTableComponentRef.current?.hotInstance?.countRows() || 0) - 1;

          if (row === 0) {
            return {
              type: 'text',
              className: 'htCenter',
              readOnly: true,
            };
          }

          if (row === lastRowIndex) {
            return {
              type: 'numeric',
              className: 'htCenter',
            };
          }
        }

        return {};
      }}
      columnSummary={[
        {
          sourceColumn: 2,
          type: 'sum',
          reversedRowCoords: true,
          destinationRow: 0,
          destinationColumn: 2,
          forceNumeric: true,
          suppressDataTypeErrors: true,
        },
        {
          sourceColumn: 5,
          type: 'sum',
          reversedRowCoords: true,
          destinationRow: 0,
          destinationColumn: 5,
          forceNumeric: true,
          suppressDataTypeErrors: true,
        },
      ]}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
