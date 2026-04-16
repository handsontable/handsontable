import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

type Row = {
  item: string;
  units: number | string;
  price: number | string;
  tax: number | string;
};

const SUMMARY_SOURCE = 'updateSummary';

function parseNumeric(value: unknown): number | null {
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

const data: Row[] = [
  { item: 'Module A', units: 12, price: 49.5, tax: 5.2 },
  { item: 'Module B', units: 8, price: 120, tax: 8 },
  { item: 'Module C', units: 3, price: 200, tax: '\u2014' },
  { item: 'Module D', units: 15, price: 35, tax: 4.1 },
  { item: 'Module E', units: 0, price: 75, tax: 6 },
  { item: '', units: '', price: '', tax: '' },
];

const numericProps: (keyof Row)[] = ['units', 'price', 'tax'];
const summaryRowIndex = data.length - 1;

function formatSummary(prop: keyof Row): string {
  const numbers: number[] = [];

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

function refreshSummary(hot: Handsontable) {
  hot.batch(() => {
    hot.setDataAtRowProp(summaryRowIndex, 'item', 'Totals', SUMMARY_SOURCE);

    numericProps.forEach((prop) => {
      hot.setDataAtRowProp(summaryRowIndex, prop, formatSummary(prop), SUMMARY_SOURCE);
    });
  });
}

const container = document.querySelector('#example1')!;

// eslint-disable-next-line no-unused-vars -- recipe keeps instance for debugging
const hot = new Handsontable(container, {
  data,
  licenseKey: 'non-commercial-and-evaluation',
  rowHeaders: true,
  colHeaders: ['Item', 'Units', 'Price', 'Tax'],
  fixedRowsBottom: 1,
  height: 'auto',
  width: '100%',
  columns: [
    { data: 'item', type: 'text', readOnly: false },
    { data: 'units', type: 'numeric', numericFormat: { pattern: '0' } },
    { data: 'price', type: 'numeric', numericFormat: { pattern: '0.00' } },
    { data: 'tax', type: 'numeric', numericFormat: { pattern: '0.00' } },
  ],
  cells(row, _col, prop) {
    if (row !== summaryRowIndex) {
      return {};
    }

    const meta: Handsontable.CellProperties = {
      readOnly: true,
      className: 'htSummaryRow',
    };

    if (prop !== 'item') {
      meta.type = 'text';
      meta.className = 'htSummaryRow htRight';
    }

    return meta;
  },
  afterInit() {
    refreshSummary(this);
  },
  afterChange(changes, source) {
    if (!changes || source === SUMMARY_SOURCE) {
      return;
    }

    if (changes.every(([row]) => row === summaryRowIndex)) {
      return;
    }

    refreshSummary(this);
  },
  beforeUndoStackChange(_doneActions, source) {
    if (source === SUMMARY_SOURCE) {
      return false;
    }
  },
});
