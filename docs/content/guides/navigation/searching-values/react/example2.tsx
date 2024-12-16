import { useRef, useCallback } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  const data = [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'yellow', 'gray'],
  ];

  const searchFieldKeyupCallback = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const hot = hotRef.current?.hotInstance;
      const search = hot?.getPlugin('search');
      const queryResult = search?.query(event.currentTarget.value);

      console.log(queryResult);
      hot?.render();
    },
    [hotRef.current]
  );

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <input
            id="search_field2"
            type="search"
            placeholder="Search"
            onKeyUp={(...args) => searchFieldKeyupCallback(...args)}
          />
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={true}
        // enable the `Search` plugin
        search={{
          // add your custom CSS class
          searchResultClass: 'my-custom-search-result-class',
        }}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
