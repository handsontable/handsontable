import { HotTable } from '@handsontable/react-wrapper';
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

// Custom renderer: visualizes stock level as a progress bar with a numeric label.
// Demonstrates using a renderer independently from the editor and validator.
function stockRenderer(
  hotInstance: Handsontable.Core,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: Handsontable.CellValue
): HTMLTableCellElement {
  const num = parseInt(value as string, 10);
  const valid = !isNaN(num) && num >= 0;
  const pct = valid ? Math.min(100, (num / 1000) * 100) : 0;
  const color = pct > 60 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444';

  td.innerText = '';

  const wrapper = hotInstance.rootDocument.createElement('div');

  wrapper.className = 'htStockBar';

  const track = hotInstance.rootDocument.createElement('div');

  track.className = 'htStockBarTrack';

  const fill = hotInstance.rootDocument.createElement('div');

  fill.className = 'htStockBarFill';
  fill.style.width = `${pct}%`;
  fill.style.background = color;

  const label = hotInstance.rootDocument.createElement('span');

  label.className = 'htStockBarLabel';
  label.innerText = valid ? `${num}` : '—';
  track.appendChild(fill);
  wrapper.appendChild(track);
  wrapper.appendChild(label);
  td.appendChild(wrapper);

  return td;
}

// Custom validator: accepts integers in the range 0–1000.
// Demonstrates using a validator independently from the renderer and editor.
function stockValidator(value: Handsontable.CellValue, callback: (valid: boolean) => void): void {
  const num = Number(value);

  callback(Number.isInteger(num) && num >= 0 && num <= 1000);
}

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['Apple', 1.2, 820],
        ['Banana', 0.5, 280],
        ['Cherry', 3.0, 45],
        ['Mango', 2.5, 960],
        ['Pear', 0.8, 170],
        ['Blueberry', 4.5, 15],
      ]}
      colHeaders={['Product', 'Price', 'Stock']}
      columns={[
        // Built-in type bundles renderer + editor + no validator
        { type: 'text' },
        // Built-in type bundles renderer + editor + validator with custom format
        { type: 'numeric', locale: 'en-US', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 } },
        // Mixed: custom renderer, built-in numeric editor, custom validator
        {
          renderer: stockRenderer,
          editor: 'numeric',
          validator: stockValidator,
          allowInvalid: false,
        } as Handsontable.ColumnSettings,
      ]}
      colWidths={[120, 90, 200]}
      rowHeaders={true}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
