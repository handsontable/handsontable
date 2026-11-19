import { useEffect, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const data = [
  ['Hannah Schmidt', 'Product manager', 'Platform', 'Berlin'],
  ['Kenji Watanabe', 'Backend engineer', 'Platform', 'Tokyo'],
  ['Sofia Rossi', 'UX designer', 'Design', 'Milan'],
  ['Mateo Fernandez', 'Account executive', 'Sales', 'Madrid'],
  ['Amara Okafor', 'Data analyst', 'Insights', 'Lagos'],
  ['Lukas Novak', 'Frontend engineer', 'Web', 'Prague'],
  ['Priya Nair', 'QA engineer', 'Web', 'Bengaluru'],
  ['Elias Lindqvist', 'Support specialist', 'Support', 'Stockholm'],
  ['Zofia Kowalska', 'Frontend engineer', 'Web', 'Warsaw'],
  ['Daniel Becker', 'Sales engineer', 'Sales', 'Berlin'],
  ['Camille Laurent', 'Content designer', 'Design', 'Paris'],
  ['Omar Haddad', 'Site reliability engineer', 'Platform', 'Dubai'],
  ['Isabela Costa', 'Data engineer', 'Insights', 'Lisbon'],
  ['Thomas Wright', 'Support specialist', 'Support', 'Toronto'],
  ['Mei Lin Chen', 'Product designer', 'Design', 'Singapore'],
  ['Jonas Meyer', 'Account manager', 'Sales', 'Vienna'],
];

const colHeaders = ['Name', 'Role', 'Team', 'Location'];
const hiddenRowsSettings = { indicators: false };

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const timeoutRef = useRef(undefined);
  const [status, setStatus] = useState(`Showing ${data.length} of ${data.length} rows`);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const filterRows = (value) => {
    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    const query = value.trim();
    const results = hot.getPlugin('search').query(query);
    const matchingRows = new Set(results.map(({ row }) => row));
    const hiddenRowsPlugin = hot.getPlugin('hiddenRows');
    const totalRows = hot.countRows();
    const rowsToHide = [];

    if (query !== '') {
      for (let row = 0; row < totalRows; row += 1) {
        if (!matchingRows.has(row)) {
          rowsToHide.push(row);
        }
      }
    }

    hot.batch(() => {
      hiddenRowsPlugin.showRows(hiddenRowsPlugin.getHiddenRows());
      hiddenRowsPlugin.hideRows(rowsToHide);
      hot.render();
    });

    const visibleRows = totalRows - rowsToHide.length;

    setStatus(visibleRows === 0 ? `No rows match "${query}"` : `Showing ${visibleRows} of ${totalRows} rows`);
  };

  const handleSearchInput = (event) => {
    const { value } = event.currentTarget;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => filterRows(value), 120);
  };

  return (
    <div>
      <div className="example-controls-container">
        <div className="controls">
          <label htmlFor="search-filter-input">Filter rows</label>
          <input
            id="search-filter-input"
            type="search"
            placeholder="Type to filter rows..."
            onInput={handleSearchInput}
          />
          <span id="search-filter-status" aria-live="polite">
            {status}
          </span>
        </div>
      </div>
      <HotTable
        // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
        ref={hotRef}
        data={data}
        rowHeaders={true}
        colHeaders={colHeaders}
        height="auto"
        width="100%"
        autoWrapRow={true}
        autoWrapCol={true}
        search={true}
        hiddenRows={hiddenRowsSettings}
      />
    </div>
  );
};

export default ExampleComponent;
