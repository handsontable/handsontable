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

    searchFieldKeyupCallback = function(event) {
      const search = hot.getPlugin('search');
      const queryResult = search.query(event.target.value);

      console.log(queryResult);
      hot.render();
    };
  });

  return (
    <>
      <div class="example-controls-container">
        <div className="controls">
          <input id="search_field2" type="search" placeholder="Search" onKeyUp={(...args) => searchFieldKeyupCallback(...args)}/>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={true}
        // enable the `Search` plugin
        search={{
          // add your custom CSS class
          searchResultClass: 'my-custom-search-result-class'
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
