import { useRef, useState } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import Handsontable from 'handsontable/base';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hot4Ref = useRef<HotTableRef>(null);
  const [resultCount, setResultCounter] = useState(0);

  const data = [
    ['Hydrogen', 'H', 1, 1.008],
    ['Helium', 'He', 2, 4.003],
    ['Lithium', 'Li', 3, 6.94],
    ['Beryllium', 'Be', 4, 9.012],
    ['Boron', 'B', 5, 10.81],
  ];

  //  define your custom callback function
  function searchResultCounter(
    this: Handsontable,
    _instance: Handsontable,
    _row: number,
    _col: number,
    _value: any,
    result: any
  ) {
    const DEFAULT_CALLBACK = function (instance: Handsontable, row: number, col: number, _data: any, testResult: any) {
      instance.getCellMeta(row, col).isSearchResult = testResult;
    };

    DEFAULT_CALLBACK.apply(this, arguments as any);

    if (result) {
      setResultCounter((count) => count + 1);
    }
  }

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setResultCounter(0);

    const search = hot4Ref.current?.hotInstance?.getPlugin('search');
    const queryResult = search?.query(event.currentTarget.value);

    console.log(queryResult);

    hot4Ref.current?.hotInstance?.render();
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <input id="search_field4" type="search" placeholder="Search" onKeyUp={handleKeyUp} />
        </div>
        <output className="console" id="output">
          {resultCount} results
        </output>
      </div>
      <HotTable
        ref={hot4Ref}
        data={data}
        colHeaders={['Name', 'Symbol', 'Atomic number', 'Atomic mass']}
        // enable the `Search` plugin
        search={{
          // add your custom callback function
          callback: searchResultCounter,
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
