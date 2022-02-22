import Handsontable from "handsontable/base";
import "handsontable/dist/handsontable.min.css";
import "pikaday/css/pikaday.css";

// import { data } from "./constants";
import { progressBarRenderer, starRenderer } from "./customRenderers";
import "./styles.css";
import { registerLanguageDictionary, arAR } from 'handsontable/i18n';

// choose cell types you want to use and import them
import { registerCellType, DropdownCellType, DateCellType, CheckboxCellType, NumericCellType } from 'handsontable/cellTypes';

import {
  registerPlugin,
  Filters,
  DropdownMenu,
  AutoColumnSize,
  HiddenRows,
} from 'handsontable/plugins';

// register imported cell types and plugins
registerPlugin(AutoColumnSize);
registerPlugin(DropdownMenu);
registerPlugin(HiddenRows);
registerPlugin(Filters);

// register imported cell types and plugins
registerCellType(DateCellType);
registerCellType(DropdownCellType);
registerCellType(CheckboxCellType);
registerCellType(NumericCellType);

registerLanguageDictionary(arAR);

import {
  alignHeaders,
  addClassesToRows,
  changeCheckboxCell
} from "./hooksCallbacks";

const example = document.getElementById("example");

const randomName = () =>
  ["عمر", "علي", "عبد الله", "معتصم"][Math.floor(Math.random() * 3)];
const randomCountry = () =>
  ["تركيا", "مصر", "لبنان", "العراق"][Math.floor(Math.random() * 3)];
const randomDate = () =>
  new Date(Math.floor(Math.random() * Date.now())).toLocaleDateString()
const randomBool = () => Math.random() > 0.5;
const randomNumber = (a = 0, b = 1000) => a + Math.floor(Math.random() * b);
const randomPhrase = () =>
  `${randomCountry()} ${randomName()} ${randomNumber()}`;

function generateArabicData() {
  const arr = Array.from({ length: 50 }, () => [
    randomBool(),
    randomName(),
    randomCountry(),
    randomPhrase(),
    randomDate(),
    randomPhrase(),
    randomBool(),
    randomNumber(0, 200).toString(),
    randomNumber(0, 10),
    randomNumber(0, 5),
  ]);

  return arr;
}

new Handsontable(example, {
  data: generateArabicData(),
  height: 450,
  language: arAR.languageCode,
  layoutDirection: 'rtl',
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
