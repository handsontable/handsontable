import { useMemo, useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

type SearchResult = { row: number; col: number; data: unknown };

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
/* end:skip-in-preview */

const colHeaders = ['Name', 'Role', 'Team', 'Location'];
const hiddenRowsSettings = { copyPasteEnabled: false };

const debounce = (callback: () => void, delay = 120) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filterRows = useMemo(() => debounce(() => {
    const hot = hotRef.current?.hotInstance;
    const searchInput = searchInputRef.current;

    if (!hot || !searchInput) {
      return;
    }

    const results = hot.getPlugin('search').query(searchInput.value) as SearchResult[];
    const matchingRows = new Set(results.map(result => result.row));

    const hiddenRows = hot.getPlugin('hiddenRows');
    const rowsToHide: number[] = [];

    if (searchInput.value !== '') {
      for (let row = 0; row < hot.countRows(); row += 1) {
        if (!matchingRows.has(row)) {
          rowsToHide.push(row);
        }
      }
    }

    hot.batch(() => {
      hiddenRows.showRows(hiddenRows.getHiddenRows().filter(row => row !== null));
      hiddenRows.hideRows(rowsToHide);
      hot.render();
    });
  }), []);

  return (
    <div>
      <div className="example-controls-container">
        <div className="controls">
          <label htmlFor="search-filter-input">Filter rows</label>
          <input id="search-filter-input" type="search" ref={searchInputRef} onInput={filterRows} />
        </div>
      </div>
      <HotTable
        // licenseKey="your-license-key" get a key at https://handsontable.com/pricing/
        ref={hotRef}
        data={data}
        rowHeaders={true}
        colHeaders={colHeaders}
        height="auto"
        search={true}
        hiddenRows={hiddenRowsSettings}
      />
    </div>
  );
};

export default ExampleComponent;
