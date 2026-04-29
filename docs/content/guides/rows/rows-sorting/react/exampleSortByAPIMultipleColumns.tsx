import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotTableComponentRef = useRef<HotTableRef>(null);
  const sort = () => {
    // get the `MultiColumnSorting` plugin
    const multiColumnSorting = hotTableComponentRef.current?.hotInstance?.getPlugin('multiColumnSorting');

    multiColumnSorting?.sort([
      {
        column: 0,
        sortOrder: 'asc',
      },
      {
        column: 1,
        sortOrder: 'desc',
      },
    ]);
  };

  return (
    <>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          {
            brand: 'Jetpulse',
            model: 'Racing Socks',
            price: 30,
            sellDate: '2023-10-11',
            sellTime: '01:23',
            inStock: false,
          },
          {
            brand: 'Jetpulse',
            model: 'HL Mountain Frame',
            price: 1890.9,
            sellDate: '2023-05-03',
            sellTime: '11:27',
            inStock: false,
          },
          {
            brand: 'Jetpulse',
            model: 'Cycling Cap',
            price: 130.1,
            sellDate: '2023-03-27',
            sellTime: '03:17',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: '2023-08-28',
            sellTime: '08:01',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: '2023-10-02',
            sellTime: '13:23',
            inStock: true,
          },
        ]}
        columns={[
          {
            title: 'Brand',
            type: 'text',
            data: 'brand',
          },
          {
            title: 'Model',
            type: 'text',
            data: 'model',
          },
          {
            title: 'Price',
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
            title: 'Date',
            type: 'intl-date',
            data: 'sellDate',
            locale: 'en-US',
            dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
            className: 'htRight',
          },
          {
            title: 'Time',
            type: 'intl-time',
            data: 'sellTime',
            locale: 'en-US',
            timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
            className: 'htRight',
          },
          {
            title: 'In stock',
            type: 'checkbox',
            data: 'inStock',
            className: 'htCenter',
          },
        ]}
        multiColumnSorting={true}
        height="auto"
        stretchH="all"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="example-controls-container">
        <div className="controls">
          <button onClick={sort}>Sort</button>
        </div>
      </div>
    </>
  );
};

export default ExampleComponent;
