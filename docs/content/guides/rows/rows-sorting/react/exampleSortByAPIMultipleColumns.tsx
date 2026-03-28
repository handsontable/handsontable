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
      <div className="example-controls-container">
        <div className="controls">
          <button onClick={sort}>Sort</button>
        </div>
      </div>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          { brand: 'Jetpulse', model: 'Racing Socks', price: 30, sellDate: 'Oct 11, 2025', sellTime: '01:23 AM', inStock: false },
          { brand: 'Jetpulse', model: 'HL Mountain Frame', price: 1890.9, sellDate: 'May 3, 2025', sellTime: '11:27 AM', inStock: false },
          { brand: 'Jetpulse', model: 'Cycling Cap', price: 130.1, sellDate: 'Mar 27, 2025', sellTime: '03:17 AM', inStock: true },
          { brand: 'Chatterpoint', model: 'Road Tire Tube', price: 59, sellDate: 'Aug 28, 2025', sellTime: '08:01 AM', inStock: true },
          { brand: 'Chatterpoint', model: 'HL Road Tire', price: 279.99, sellDate: 'Oct 2, 2025', sellTime: '01:23 PM', inStock: true },
          { brand: 'Chatterpoint', model: 'Speed Gloves', price: 135.49, sellDate: 'Jun 14, 2025', sellTime: '10:45 AM', inStock: false },
          { brand: 'Gigabox', model: 'Carbon Handlebar', price: 1080.7, sellDate: 'Sep 5, 2025', sellTime: '09:35 AM', inStock: false },
          { brand: 'Gigabox', model: 'Trail Helmet', price: 1298.14, sellDate: 'Aug 31, 2025', sellTime: '02:12 PM', inStock: true },
          { brand: 'Gigabox', model: 'Windbreaker Jacket', price: 178.9, sellDate: 'Jul 16, 2025', sellTime: '07:11 PM', inStock: true },
          { brand: 'Camido', model: 'Comfort Saddle', price: 1456.24, sellDate: 'Jul 20, 2025', sellTime: '03:39 AM', inStock: false },
          { brand: 'Camido', model: 'Aero Bottle', price: 1571.13, sellDate: 'May 24, 2025', sellTime: '12:24 AM', inStock: true },
          { brand: 'Camido', model: 'LED Bike Light', price: 1012.5, sellDate: 'Apr 15, 2025', sellTime: '05:30 PM', inStock: false },
          { brand: 'Eidel', model: 'Fitness Watch', price: 1075.31, sellDate: 'Nov 7, 2025', sellTime: '05:47 PM', inStock: true },
          { brand: 'Eidel', model: 'Action Camera', price: 1019.05, sellDate: 'Dec 7, 2025', sellTime: '01:26 AM', inStock: false },
          { brand: 'Eidel', model: 'Hydration Pack', price: 954.84, sellDate: 'Nov 2, 2025', sellTime: '12:59 AM', inStock: false },
        ]}
        columns={[
          {
            title: 'Brand',
            type: 'text',
            data: 'brand',
            width: 120,
            headerClassName: 'htLeft',
          },
          {
            title: 'Model',
            type: 'text',
            data: 'model',
            width: 150,
            headerClassName: 'htLeft',
          },
          {
            title: 'Price',
            type: 'numeric',
            data: 'price',
            width: 90,
            numericFormat: {
              pattern: '$0,0.00',
              culture: 'en-US',
            },
            className: 'htRight',
            headerClassName: 'htRight',
          },
          {
            title: 'Date',
            type: 'date',
            data: 'sellDate',
            width: 130,
            dateFormat: 'MMM D, YYYY',
            correctFormat: true,
            className: 'htRight',
            headerClassName: 'htRight',
          },
          {
            title: 'Time',
            type: 'time',
            data: 'sellTime',
            width: 90,
            timeFormat: 'hh:mm A',
            correctFormat: true,
            className: 'htRight',
            headerClassName: 'htRight',
          },
          {
            title: 'In stock',
            type: 'checkbox',
            data: 'inStock',
            className: 'htCenter',
            headerClassName: 'htCenter',
          },
        ]}
        multiColumnSorting={true}
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
