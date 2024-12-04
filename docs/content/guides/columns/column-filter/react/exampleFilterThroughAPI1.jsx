import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotTableComponentRef = useRef(null);
  const filterBelow200 = () => {
    // get the `Filters` plugin, so you can use its API
    const filters =
      hotTableComponentRef.current?.hotInstance?.getPlugin('filters');

    // clear any existing filters
    filters?.clearConditions();
    // filter data by the 'Price' column (column at index 2)
    // to display only items that are less than ('lt') $200
    filters?.addCondition(2, 'lt', [200]);
    filters?.filter();
  };

  const filterAbove200 = () => {
    // get the `Filters` plugin, so you can use its API
    const filters =
      hotTableComponentRef.current?.hotInstance?.getPlugin('filters');

    filters?.clearConditions();
    // display only items that are more than ('gt') $200
    filters?.addCondition(2, 'gt', [200]);
    filters?.filter();
  };

  const clearAllFilters = () => {
    // get the `Filters` plugin, so you can use its API
    const filters =
      hotTableComponentRef.current?.hotInstance?.getPlugin('filters');

    // clear all filters
    filters?.clearConditions();
    filters?.filter();
  };

  return (
    <>
      <div className="controls">
        <button onClick={filterBelow200}>Show items &lt; $200</button>
        <button onClick={filterAbove200}>Show items &gt; $200</button>
        <button onClick={clearAllFilters}>Clear filters</button>
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
        // enable filtering
        filters={true}
        // enable the column menu
        dropdownMenu={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
