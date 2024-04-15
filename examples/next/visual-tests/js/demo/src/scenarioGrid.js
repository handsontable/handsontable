import Handsontable from "handsontable/base";
import "handsontable/dist/handsontable.css";
import "@handsontable/pikaday/css/pikaday.css";
import { scenarioData } from './constants';

import { generateExampleData, isArabicDemoEnabled } from "./utils";
import { progressBarRenderer, starRenderer } from "./customRenderers";
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
  MergeCells,
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
registerPlugin(MergeCells);
registerPlugin(MultiColumnSorting);
registerPlugin(UndoRedo);

// register imported cell types and plugins
registerCellType(DateCellType);
registerCellType(DropdownCellType);
registerCellType(CheckboxCellType);
registerCellType(NumericCellType);

registerLanguageDictionary(arAR);

import {
  alignHeaders,
  addClassesToRows,
  changeCheckboxCell,
  drawCheckboxInRowHeaders
} from "./hooksCallbacks";

const example = document.getElementById("example");
export function initializeScenarioGrid() {

new Handsontable(example, {
  data: scenarioData,
  layoutDirection: isArabicDemoEnabled() ? "rtl" : "ltr",
  language: isArabicDemoEnabled() ? arAR.languageCode : "en-US",
  height: 250,
  colHeaders: [
    'Product ID',
    'Mobile Apps',
    'Pricing',
    'Rating',
    'Category',
    'Industry',
    'Business Scale',
    'User Type',
    'No of Users',
    'Deployment',
    'OS',
  ],
  columns: [
    { data: 'product_id', type: 'numeric' },
    { data: 'mobile_apps', type: 'text' },
    { data: 'pricing', type: 'text' },
    { data: 'rating', type: 'numeric' },
    { data: 'category', type: 'text' },
    { data: 'industry', type: 'text' },
    { data: 'business_scale', type: 'text' },
    { data: 'user_type', type: 'text' },
    { data: 'no_of_users', type: 'text' },
    { data: 'deployment', type: 'text' },
    { data: 'OS', type: 'text' },
  ],
  mergeCells: true,
  dropdownMenu: true,
  hiddenColumns: {
    indicators: true
  },
  navigableHeaders: true,
  contextMenu: true,
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  manualRowMove: true,
  comments: true,
  manualColumnMove: true,
  customBorders: true,
  afterGetColHeader: alignHeaders,
  afterGetRowHeader: drawCheckboxInRowHeaders,
  afterOnCellMouseDown: changeCheckboxCell,
  beforeRenderer: addClassesToRows,
  autoWrapCol: true,
  autoWrapRow: true,
  licenseKey: "non-commercial-and-evaluation"
});

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);}
