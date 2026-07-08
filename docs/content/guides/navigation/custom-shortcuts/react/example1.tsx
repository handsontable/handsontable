import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  const data: (string | number)[][] = [
    ['SKU-4821', 'Wireless Mouse', 128, 'Electronics'],
    ['SKU-0093', 'Desk Lamp', 42, 'Home Goods'],
    ['SKU-7734', 'USB-C Cable', 310, 'Electronics'],
    ['SKU-2210', 'Notebook Set', 87, 'Office Supplies'],
    ['SKU-5567', 'Water Bottle', 156, 'Outdoor'],
  ];

  const afterInitCallback = () => {
    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    // get the `grid` context from the `ShortcutManager` API
    const gridContext = hot.getShortcutManager().getContext('grid');

    // register a custom keyboard shortcut in the `grid` context:
    // pressing Control/Meta+Enter inserts a new row below the selected cell
    gridContext.addShortcut({
      keys: [['control/meta', 'enter']],
      group: 'insertRowBelow',
      callback: () => {
        const selected = hot.getSelectedRangeLast();

        if (!selected) {
          return;
        }

        hot.alter('insert_row_below', selected.highlight.row);
      },
    });
  };

  return (
    <HotTable
      ref={hotRef}
      data={data}
      colHeaders={['SKU', 'Product', 'Quantity', 'Category']}
      columns={[{}, {}, { type: 'numeric' }, {}]}
      height="auto"
      afterInit={afterInitCallback}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
