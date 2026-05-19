import { useRef, useCallback } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const data = [
  ['Alice Johnson', 'Engineering', 'Berlin', 'alice.johnson@example.com'],
  ['Noah Smith', 'Design', 'Warsaw', 'noah.smith@example.com'],
  ['Mia Garcia', 'Marketing', 'New York', 'mia.garcia@example.com'],
  ['Liam Brown', 'Engineering', 'Toronto', 'liam.brown@example.com'],
  ['Emma Davis', 'Sales', 'London', 'emma.davis@example.com'],
  ['Oliver Miller', 'Support', 'Madrid', 'oliver.miller@example.com'],
];
/* end:skip-in-preview */

const debounce = (callback, delay = 120) => {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
};

const ExampleComponent = () => {
  const hotRef = useRef(null);

  const runSearch = useCallback(
    debounce((value) => {
      const hot = hotRef.current?.hotInstance;

      if (!hot) {
        return;
      }

      hot.getPlugin('search').query(value);
      hot.render();
    }),
    []
  );

  function handleSearchInput(e) {
    runSearch(e.target.value);
  }

  return (
    <div>
      <div className="example-controls-container">
        <div className="controls">
          <label htmlFor="external-search-input">Search rows</label>
          <input
            id="external-search-input"
            type="search"
            placeholder="Type to highlight matching cells..."
            onInput={handleSearchInput}
          />
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        rowHeaders={true}
        colHeaders={['Name', 'Team', 'Location', 'Email']}
        height="auto"
        width="100%"
        autoWrapRow={true}
        autoWrapCol={true}
        search={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
