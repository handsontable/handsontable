import { useRef, useCallback } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
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

const debounce = (callback: (...args: unknown[]) => void, delay = 120) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: unknown[]) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
};

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  const runSearch = useCallback(
    debounce((value: unknown) => {
      const hot = hotRef.current?.hotInstance;

      if (!hot) {
        return;
      }

      hot.getPlugin('search').query(String(value));
      hot.render();
    }),
    []
  );

  function handleSearchInput(e: React.FormEvent<HTMLInputElement>) {
    runSearch(e.currentTarget.value);
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
