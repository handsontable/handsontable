import Handsontable from 'handsontable';
import type { SummaryEndpoint } from 'handsontable/plugins/columnSummary';

interface Endpoint {
  destinationRow: number;
  destinationColumn: number;
  forceNumeric: boolean;
  reversedRowCoords: boolean;
  suppressDataTypeErrors: boolean;
  readOnly: boolean;
  roundFloat: number | false | 'auto';
  ranges: number[][];
  sourceColumn: number;
  type: string;
  result: number;
  customFunction: null | ((endpoint: unknown) => number);
}

const hot = new Handsontable(document.createElement('div'), {
  columnSummary: [
    {
      sourceColumn: 0,
      type: 'sum',
      destinationRow: 3,
      destinationColumn: 0,
      forceNumeric: true
    },
    {
      sourceColumn: 1,
      type: 'min',
      destinationRow: 3,
      destinationColumn: 1
    },
    {
      sourceColumn: 2,
      type: 'custom',
      destinationRow: 3,
      destinationColumn: 2,
      customFunction(endpoint: unknown) {
        return 1;
      }
    },
    {
      sourceColumn: 3,
      type: 'count',
      destinationRow: 3,
      destinationColumn: 3,
      roundFloat: 'auto',
      reversedRowCoords: true,
    },
    {
      sourceColumn: 4,
      type: 'average',
      destinationRow: 3,
      destinationColumn: 4,
      ranges: [
        [0, 2], [4], [6, 8]
      ],
    },
  ],
});

new Handsontable(document.createElement('div'), {
  columnSummary() {
    return [
      {
        sourceColumn: 0,
        type: 'sum',
        destinationRow: this.hot.countRows() - 1,
        destinationColumn: this.hot.countCols() - 1,
        forceNumeric: true
      },
    ];
  }
});
const columnSummary = hot.getPlugin('columnSummary');
const endpoint: SummaryEndpoint = {
  destinationRow: 0,
  destinationColumn: 0,
  forceNumeric: true,
  reversedRowCoords: false,
  suppressDataTypeErrors: false,
  readOnly: true,
  roundFloat: 4,
  ranges: [[1, 1, 2, 2]],
  sourceColumn: 0,
  type: 'sum',
  result: 0,
  customFunction: null,
};

const endpoint2: SummaryEndpoint = {
  destinationRow: 0,
  destinationColumn: 0,
  forceNumeric: false,
  reversedRowCoords: true,
  suppressDataTypeErrors: true,
  readOnly: true,
  roundFloat: false,
  ranges: [[1, 1, 2, 2]],
  sourceColumn: 0,
  type: 'sum',
  result: 0,
  customFunction: null,
};

const endpoint3: SummaryEndpoint = {
  destinationRow: 0,
  destinationColumn: 0,
  forceNumeric: false,
  reversedRowCoords: true,
  suppressDataTypeErrors: true,
  readOnly: true,
  roundFloat: 'auto',
  ranges: [[1, 1, 2, 2]],
  sourceColumn: 0,
  type: 'sum',
  result: 0,
  customFunction: null,
};

columnSummary.calculate(endpoint);
const sum: number = columnSummary.calculateSum(endpoint);
const min: number | string = columnSummary.calculateMinMax(endpoint, 'min');
const max: number | string = columnSummary.calculateMinMax(endpoint, 'max');
const avr: number = columnSummary.calculateAverage(endpoint);
const empty: number = columnSummary.countEmpty([1, 1, 2, 2], 2);
const entries: number = columnSummary.countEntries(endpoint);
const cellValue: unknown = columnSummary.getCellValue(2, 2);
const partialMin: number | null = columnSummary.getPartialMinMax([1, 1, 2, 2], 2, 'min');
const partialMax: number | null = columnSummary.getPartialMinMax([1, 1, 2, 2], 2, 'max');
const partialSum: number = columnSummary.getPartialSum([1, 1, 2, 2], 2);
