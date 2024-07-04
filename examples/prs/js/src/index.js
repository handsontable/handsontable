import Handsontable from "handsontable";
import "handsontable/dist/handsontable.min.css";
import "pikaday/css/pikaday.css";

import { data } from "./constants";

import { alignHeaders, addClassesToRows } from "./hooksCallbacks";

const example = document.getElementById("handsontable");

new Handsontable(example, {
  data,
  height: 450,
  colWidths: [170, 156, 222, 130, 130, 120, 120],
  colHeaders: [
    "Company name",
    "Country",
    "Name",
    "Sell date",
    "Order ID",
    "In stock",
    "Qty",
  ],
  columns: [
    { data: 1, type: "text" },
    { data: 2, type: "text" },
    { data: 3, type: "text" },
    {
      data: 4,
      type: "date",
      allowInvalid: false,
    },
    { data: 5, type: "text" },
    {
      data: 6,
      type: "checkbox",
      className: "htCenter",
    },
    {
      data: 7,
      type: "numeric",
    },
  ],
  dropdownMenu: true,
  hiddenColumns: {
    indicators: true,
  },
  contextMenu: true,
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  manualRowMove: true,
  autoWrapCol: true,
  autoWrapRow: true,
  afterGetColHeader: alignHeaders,
  beforeRenderer: addClassesToRows,
  licenseKey: "non-commercial-and-evaluation",
});
