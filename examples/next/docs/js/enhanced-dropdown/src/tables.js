import Handsontable from "handsontable/base";
import "handsontable/dist/handsontable.min.css";
import "./styles.css";

import {
  registerCellType,
  DropdownCellType,
} from "handsontable/cellTypes";

registerCellType(DropdownCellType);

const colHeaders = [
  'Year',
  'Volvo',
  'Toyota',
  'Ford',
  'Status'
]

const sampleDataSet = [
  ['2018', 10, 11, 22, null],
  ['2019', 20, 12, 23, null],
  ['2020', 30, 13, 24, null],
  ['2021', 40, 14, 25, null],
  ['2022', 50, 15, 25, null]
];

const DropdownBaselineSource = {
  data: 4,
  type: 'dropdown',
  className: "pill",
  source: ['red', 'green', 'blue']
}

const DropdownUndocumentedSource = {
  data: 4,
  type: 'dropdown',
  className: "pill",
  source: (currentValue, callback) => {
    if ('yellow' == currentValue) {
      callback(['yellow', 'yellow1', 'yellow2', 'yellow3', 'lime', 'orange'])
    } else {
      callback(['yellow', 'lime', 'orange'])
    }
  }
}

const DropdownNewRangeSource = {
  data: 4,
  type: 'dropdown',
  className: "pill",
  sourceRange: {
    row: 0, column: 0,
    row2: 4, column2: 1
  }
}

function createTable(containerId, dropdownSource) {
  const test = JSON.parse(JSON.stringify(sampleDataSet))
  const container = document.getElementById(containerId)
  container.hot = new Handsontable(container, {
    licenseKey: 'non-commercial-and-evaluation',
    data: JSON.parse(JSON.stringify(sampleDataSet)),
    colWidths: [75, 75, 75, 75, 125],
    colHeaders,
    columns: [
      { data: 0, type: "text" },
      { data: 1, type: "text" },
      { data: 2, type: "text" },
      { data: 3, type: "text" },
      dropdownSource
    ]
  })
}

createTable('dropdown-baseline', DropdownBaselineSource)
createTable('dropdown-undocumented', DropdownUndocumentedSource)
createTable('dropdown-new', DropdownNewRangeSource)
