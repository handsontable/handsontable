import { useRef, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);

  const data = [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'yellow', 'gray']
  ];
  let searchFieldKeyupCallback;

  useEffect(() => {
    const hot = hotRef.current.hotInstance;

    //  add a search input listener
    searchFieldKeyupCallback = function(event) {
      // get the `Search` plugin's instance
      const search = hot.getPlugin('search');
      // use the `Search` plugin's `query()` method
      const queryResult = search.query(event.target.value);

      console.log(queryResult);

      hot.render();
    };
  });

  return (
    <>
      <div class="example-controls-container">
        <div className="controls">
          <input id="search_field" type="search" placeholder="Search" onKeyUp={(...args) => searchFieldKeyupCallback(...args)}/>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={true}
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
