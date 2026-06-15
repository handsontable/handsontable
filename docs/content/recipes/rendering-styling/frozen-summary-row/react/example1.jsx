import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import './example1.css';

registerAllModules();

const SUMMARY_SOURCE = 'updateSummary';

function parseNumeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);

    if (Number.isFinite(n)) {
      return n;
    }
  }

  return null;
}

const data = [
  { item: 'Module A', units: 12, price: 49.5, tax: 5.2 },
  { item: 'Module B', units: 8, price: 120, tax: 8 },
  { item: 'Module C', units: 3, price: 200, tax: '\u2014' },
  { item: 'Module D', units: 15, price: 35, tax: 4.1 },
  { item: 'Module E', units: 0, price: 75, tax: 6 },
  { item: '', units: '', price: '', tax: '' },
];

const numericProps = ['units', 'price', 'tax'];
const summaryRowIndex = data.length - 1;

function formatSummary(prop) {
  const numbers = [];

  for (let row = 0; row < summaryRowIndex; row += 1) {
    const n = parseNumeric(data[row][prop]);

    if (n !== null) {
      numbers.push(n);
    }
  }

  if (numbers.length === 0) {
    return '\u2014';
  }

  const sum = numbers.reduce((acc, n) => acc + n, 0);
  const avg = sum / numbers.length;

  return `Sum: ${sum.toFixed(2)} · Avg: ${avg.toFixed(2)} · Count: ${numbers.length}`;
}

function refreshSummary(hot) {
  hot.batch(() => {
    hot.setDataAtRowProp(summaryRowIndex, 'item', 'Totals', SUMMARY_SOURCE);

    numericProps.forEach((prop) => {
      hot.setDataAtRowProp(summaryRowIndex, prop, formatSummary(prop), SUMMARY_SOURCE);
    });
  });
}

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      licenseKey="non-commercial-and-evaluation"
      rowHeaders={true}
      colHeaders={['Item', 'Units', 'Price', 'Tax']}
      fixedRowsBottom={1}
      height="auto"
      width="100%"
      columns={[
        { data: 'item', type: 'text', readOnly: false },
        { data: 'units', type: 'numeric', numericFormat: { maximumFractionDigits: 0 } },
        { data: 'price', type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
        { data: 'tax', type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
      ]}
      cells={function (row, _col, prop) {
        if (row !== summaryRowIndex) {
          return {};
        }

        const meta = {
          readOnly: true,
          className: 'htSummaryRow',
        };

        if (prop !== 'item') {
          meta.type = 'text';
          meta.className = 'htSummaryRow htRight';
        }

        return meta;
      }}
      afterInit={function () {
        refreshSummary(this);
      }}
      afterChange={function (changes, source) {
        if (!changes || source === SUMMARY_SOURCE) {
          return;
        }

        if (changes.every(([row]) => row === summaryRowIndex)) {
          return;
        }

        refreshSummary(this);
      }}
      beforeUndoStackChange={function (_doneActions, source) {
        if (source === SUMMARY_SOURCE) {
          return false;
        }
      }}
    />
  );
};

export default ExampleComponent;
