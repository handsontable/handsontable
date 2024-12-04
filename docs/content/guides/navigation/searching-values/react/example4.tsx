import { useRef, useState } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import Handsontable from 'handsontable';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hot4Ref = useRef<HotTableRef>(null);
  const [resultCount, setResultCounter] = useState(0);

  const data = [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray'],
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
    const DEFAULT_CALLBACK = function (
      instance: Handsontable,
      row: number,
      col: number,
      _data: any,
      testResult: any
    ) {
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
          <input
            id="search_field4"
            type="search"
            placeholder="Search"
            onKeyUp={handleKeyUp}
          />
        </div>
        <output className="console" id="output">
          {resultCount} results
        </output>
      </div>
      <HotTable
        ref={hot4Ref}
        data={data}
        colHeaders={true}
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
