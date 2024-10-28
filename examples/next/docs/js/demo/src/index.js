import Handsontable from "handsontable/base";
import "handsontable/dist/handsontable.min.css";
import "@handsontable/pikaday/css/pikaday.css";

import { generateExampleData, isArabicDemoEnabled } from "./utils";
import "./styles.css";
import { registerLanguageDictionary, arAR } from "handsontable/i18n";

// choose cell types you want to use and import them
import {
  registerCellType,
  CheckboxCellType,
  DateCellType,
  DropdownCellType,
  NumericCellType,
} from "handsontable/cellTypes";

import {
  registerPlugin,
  AutoColumnSize,
  ContextMenu,
  CopyPaste,
  DropdownMenu,
  Filters,
  HiddenColumns,
  HiddenRows,
  ManualRowMove,
  MultiColumnSorting,
  UndoRedo,
} from 'handsontable/plugins';

// register imported cell types and plugins
registerPlugin(AutoColumnSize);
registerPlugin(ContextMenu);
registerPlugin(CopyPaste);
registerPlugin(DropdownMenu);
registerPlugin(Filters);
registerPlugin(HiddenColumns);
registerPlugin(HiddenRows);
registerPlugin(ManualRowMove);
registerPlugin(MultiColumnSorting);
registerPlugin(UndoRedo);

// register imported cell types and plugins
registerCellType(DateCellType);
registerCellType(DropdownCellType);
registerCellType(CheckboxCellType);
registerCellType(NumericCellType);

registerLanguageDictionary(arAR);

import { addClassesToRows } from "./hooksCallbacks";

const example = document.getElementById("example");

new Handsontable(example, {
  data: generateExampleData(),
  layoutDirection: isArabicDemoEnabled() ? "rtl" : "ltr",
  language: isArabicDemoEnabled() ? arAR.languageCode : "en-US",
  height: 450,
  colWidths: [170, 222, 130, 120, 120, 130, 156],
  colHeaders: [
    "Company name",
    "Name",
    "Sell date",
    "In stock",
    "Qty",
    "Order ID",
    "Country"
  ],
  columns: [
    { data: 1, type: "text" },
    { data: 3, type: "text" },
    {
      data: 4,
      type: "date",
      allowInvalid: false,
      dateFormat: isArabicDemoEnabled() ? "M/D/YYYY" : "DD/MM/YYYY",
    },
    {
      data: 6,
      type: "checkbox",
      className: "htCenter",
      headerClassName: "htCenter"
    },
    {
      data: 7,
      type: "numeric",
      headerClassName: 'htRight'
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
  navigableHeaders: true,
  autoWrapCol: true,
  headerClassName: 'htLeft',
  beforeRenderer: addClassesToRows,
  licenseKey: "non-commercial-and-evaluation"
});

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
