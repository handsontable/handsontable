import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const CATEGORY_COL = 0;
const SUBCATEGORY_COL = 1;

/** Parent value -> allowed child dropdown labels */
const dependencyMap = {
  Fruit: ['Apple', 'Banana', 'Orange'],
  Vegetable: ['Carrot', 'Pea', 'Broccoli'],
  Grain: ['Rice', 'Wheat', 'Oats'],
};

function optionsForCategory(category) {
  return dependencyMap[category] ?? [];
}

/* start:skip-in-preview */
const data = [
  ['Fruit', 'Apple'],
  ['Vegetable', 'Carrot'],
  ['Grain', ''],
];
/* end:skip-in-preview */

const ExampleComponent = () => {
  const hotRef = useRef(null);

  function afterInit() {
    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    for (let row = 0; row < hot.countRows(); row++) {
      const category = String(hot.getDataAtCell(row, CATEGORY_COL) ?? '');

      hot.setCellMeta(row, SUBCATEGORY_COL, 'source', optionsForCategory(category));
    }

    hot.render();
  }

  function afterChange(changes, source) {
    const hot = hotRef.current?.hotInstance;

    if (!hot || source === 'loadData' || !changes) {
      return;
    }

    for (const change of changes) {
      const [row, prop, oldVal, newVal] = change;

      if (prop !== CATEGORY_COL || oldVal === newVal) {
        continue;
      }

      const next = optionsForCategory(String(newVal));

      hot.setCellMeta(row, SUBCATEGORY_COL, 'source', next);
      hot.setDataAtCell(row, SUBCATEGORY_COL, next[0] ?? '');
    }

    hot.render();
  }

  return (
    <div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={['Category', 'Subcategory']}
        columns={[
          { type: 'dropdown', source: Object.keys(dependencyMap) },
          { type: 'dropdown', source: optionsForCategory(String(data[0][CATEGORY_COL])) },
        ]}
        rowHeaders={true}
        height={200}
        width="100%"
        afterInit={afterInit}
        afterChange={afterChange}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
