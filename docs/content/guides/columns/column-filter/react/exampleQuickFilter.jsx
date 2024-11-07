// you need `useRef` to call Handsontable's instance methods
import { useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotTableComponentRef = useRef(null);

  useEffect(() => {
    const handsontableInstance = hotTableComponentRef.current?.hotInstance;
    const filterField = document.querySelector('#filterField');

    filterField?.addEventListener('keyup', function (event) {
      const filtersPlugin = handsontableInstance?.getPlugin('filters');
      const columnSelector = document.getElementById('columns');
      const columnValue = columnSelector.value;

      filtersPlugin?.removeConditions(Number(columnValue));
      filtersPlugin?.addCondition(Number(columnValue), 'contains', [
        event.target.value,
      ]);
      filtersPlugin?.filter();
      handsontableInstance?.render();
    });
  }, []);

  return (
    <>
      <div className="controlsQuickFilter">
        <label htmlFor="columns" className="selectColumn">
          Select a column:{' '}
          <select name="columns" id="columns">
            <option value="0">Brand</option>
            <option value="1">Model</option>
            <option value="2">Price</option>
            <option value="3">Date</option>
            <option value="4">Time</option>
            <option value="5">In stock</option>
          </select>
        </label>
      </div>
      <div className="controlsQuickFilter">
        <input id="filterField" type="text" placeholder="Filter" />
      </div>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          {
            brand: 'Jetpulse',
            model: 'Racing Socks',
            price: 30,
            sellDate: 'Oct 11, 2023',
            sellTime: '01:23 AM',
            inStock: false,
          },
          {
            brand: 'Gigabox',
            model: 'HL Mountain Frame',
            price: 1890.9,
            sellDate: 'May 3, 2023',
            sellTime: '11:27 AM',
            inStock: false,
          },
          {
            brand: 'Camido',
            model: 'Cycling Cap',
            price: 130.1,
            sellDate: 'Mar 27, 2023',
            sellTime: '03:17 AM',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: 'Aug 28, 2023',
            sellTime: '08:01 AM',
            inStock: true,
          },
          {
            brand: 'Eidel',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: 'Oct 2, 2023',
            sellTime: '01:23 AM',
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
            numericFormat: {
              pattern: '$ 0,0.00',
              culture: 'en-US',
            },
          },
          {
            title: 'Date',
            type: 'date',
            data: 'sellDate',
            dateFormat: 'MMM D, YYYY',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'Time',
            type: 'time',
            data: 'sellTime',
            timeFormat: 'hh:mm A',
            correctFormat: true,
            className: 'htRight',
          },
          {
            title: 'In stock',
            type: 'checkbox',
            data: 'inStock',
            className: 'htCenter',
          },
        ]}
        filters={true}
        height="auto"
        className="exampleQuickFilter"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
