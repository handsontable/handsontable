import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
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
/* end:skip-in-preview */

type SearchResult = { row: number; col: number; data: unknown };

const colHeaders = ['Name', 'Role', 'Team', 'Location'];

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  const filterRows = (event: React.FormEvent<HTMLInputElement>) => {
    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    const query = event.currentTarget.value;
    const results = hot.getPlugin('search').query(query) as SearchResult[];
    const matchingRows = results.map(result => result.row);

    const hiddenRows = hot.getPlugin('hiddenRows');
    const allRows = hot.getData().map((rowData, row) => row);
    const rowsToHide = allRows.filter(row => !matchingRows.includes(row));

    hiddenRows.showRows(hiddenRows.getHiddenRows());

    if (query !== '') {
      hiddenRows.hideRows(rowsToHide);
    }

    hot.render();
  };

  return (
    <div>
      <div className="example-controls-container">
        <div className="controls">
          <label htmlFor="search-filter-input">Filter rows</label>
          <input id="search-filter-input" type="search" onInput={filterRows} />
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
        hiddenRows={true}
      />
    </div>
  );
};

export default ExampleComponent;
