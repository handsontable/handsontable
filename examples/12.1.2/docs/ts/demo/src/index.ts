import Handsontable from "handsontable";
import "handsontable/dist/handsontable.min.css";
import "pikaday/css/pikaday.css";

import { data } from "./constants";
import { progressBarRenderer, starsRenderer } from "./customRenderers";

import {
  alignHeaders,
  drawCheckboxInRowHeaders,
  addClassesToRows,
  changeCheckboxCell
} from "./hooksCallbacks";

const example = document.getElementById("example1");
// @ts-ignore
new Handsontable(example, {
  data,
  height: 450,
  colWidths: [140, 192, 100, 90, 90, 110, 97, 100, 126],
  colHeaders: [
    "Company name",
    "Name",
    "Sell date",
    "In stock",
    "Qty",
    "Progress",
    "Rating",
    "Order ID",
    "Country"
  ],
  columns: [
    { data: 1, type: "text" },
    { data: 3, type: "text" },
    {
      data: 4,
      type: "date",
      allowInvalid: false
    },
    {
      data: 6,
      type: "checkbox",
      className: "htCenter"
    },
    {
      data: 7,
      type: "numeric"
    },
    {
      data: 8,
      renderer: progressBarRenderer,
      readOnly: true,
      className: "htMiddle"
    },
    {
      data: 9,
      renderer: starsRenderer,
      readOnly: true,
      className: "star htCenter"
    },
    { data: 5, type: "text" },
    { data: 2, type: "text" }
  ],
  dropdownMenu: true,
  hiddenColumns: {
    indicators: true
  },
  contextMenu: true,
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  afterGetColHeader: alignHeaders,
  afterGetRowHeader: drawCheckboxInRowHeaders,
  afterOnCellMouseDown: changeCheckboxCell,
  beforeRenderer: addClassesToRows,
  licenseKey: "non-commercial-and-evaluation"
});

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
