import Handsontable from "handsontable";
import "handsontable/dist/handsontable.min.css";
import "pikaday/css/pikaday.css";

import { generateExampleData, isArabicDemoEnabled } from "./utils";
import { progressBarRenderer, starRenderer } from "./customRenderers";
import "./styles.css";

import {
  alignHeaders,
  addClassesToRows,
  changeCheckboxCell
} from "./hooksCallbacks";

const example = document.getElementById("example");

new Handsontable(example, {
  data: generateExampleData(),
  layoutDirection: isArabicDemoEnabled() ? "rtl" : "ltr",
  language: isArabicDemoEnabled() ? "ar-AR" : "en-US",
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
      renderer: starRenderer,
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
  manualRowMove: true,
  afterGetColHeader: alignHeaders,
  afterOnCellMouseDown: changeCheckboxCell,
  beforeRenderer: addClassesToRows,
  licenseKey: "non-commercial-and-evaluation"
});
