import { useRef, useCallback } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);

  const data = [
    ['Hydrogen', 'H', 1, 1.008],
    ['Helium', 'He', 2, 4.003],
    ['Lithium', 'Li', 3, 6.94],
    ['Beryllium', 'Be', 4, 9.012],
    ['Boron', 'B', 5, 10.81],
  ];

  const searchFieldKeyupCallback = useCallback(
    (event) => {
      const hot = hotRef.current?.hotInstance;
      // get the `Search` plugin's instance
      const search = hot?.getPlugin('search');
      // use the `Search` plugin's `query()` method
      const queryResult = search?.query(event.currentTarget.value);

      console.log(queryResult);

      hot?.render();
    },
    [hotRef.current],
  );

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <input
            id="search_field"
            type="search"
            placeholder="Search"
            onKeyUp={(event) => searchFieldKeyupCallback(event)}
          />
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={['Name', 'Symbol', 'Atomic number', 'Atomic mass']}
        search={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
