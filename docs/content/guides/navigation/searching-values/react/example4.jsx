import { useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hot4Ref = useRef(null);
  const [resultCount, setResultCounter] = useState(0);

  const data = [
    ['Hydrogen', 'H', 1, 1.008],
    ['Helium', 'He', 2, 4.003],
    ['Lithium', 'Li', 3, 6.94],
    ['Beryllium', 'Be', 4, 9.012],
    ['Boron', 'B', 5, 10.81],
  ];

  const handleKeyUp = (event) => {
    const search = hot4Ref.current?.hotInstance?.getPlugin('search');

    if (!search) {
      return;
    }

    // the default callback marks the matching cells, so they stay highlighted
    const defaultCallback = search.getCallback();
    let count = 0;

    // pass your custom callback function: it calls the default callback and counts the matches
    const queryResult = search.query(event.currentTarget.value, (instance, row, col, value, result) => {
      defaultCallback(instance, row, col, value, result);

      if (result) {
        count++;
      }
    });

    console.log(queryResult);
    setResultCounter(count);

    hot4Ref.current?.hotInstance?.render();
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <input id="search_field4" type="search" placeholder="Search" aria-label="Search" onKeyUp={handleKeyUp} />
        </div>
        <output className="console" id="output">
          {resultCount} results
        </output>
      </div>
      <HotTable
        // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
        ref={hot4Ref}
        data={data}
        colHeaders={['Name', 'Symbol', 'Atomic number', 'Atomic mass']}
        // enable the `Search` plugin
        search={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
      />
    </>
  );
};

export default ExampleComponent;
