import { useRef, useCallback } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  const data = [
    ['Hydrogen', 'H', 1, 1.008],
    ['Helium', 'He', 2, 4.003],
    ['Lithium', 'Li', 3, 6.94],
    ['Beryllium', 'Be', 4, 9.012],
    ['Boron', 'B', 5, 10.81],
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
        colHeaders={['Name', 'Symbol', 'Atomic number', 'Atomic mass']}
        // enable the `Search` plugin
        search={{
          // add your custom CSS class
          searchResultClass: 'my-class',
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
