import Handsontable from "handsontable/base";

import { generateExampleData, isArabicDemoEnabled } from "./utils";
import { progressBarRenderer, starRenderer } from "./customRenderers";
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
  addClassesToRows,
  changeCheckboxCell,
  drawCheckboxInRowHeaders
} from "./hooksCallbacks";

const root = document.getElementById('root');
const example = document.createElement('div');
root.appendChild(example);

export function initializeDataGrid() {
  new Handsontable(example, {
    data: generateExampleData(),
    layoutDirection: isArabicDemoEnabled() ? "rtl" : "ltr",
    language: isArabicDemoEnabled() ? arAR.languageCode : "en-US",
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
        headerClassName: "htRight"
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
        className: "star htCenter",
        headerClassName: "htCenter"
      },
      { data: 5, type: "text" },
      { data: 2, type: "text" }
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
    headerClassName: isArabicDemoEnabled() ? 'htRight' : 'htLeft',
    afterGetRowHeader: drawCheckboxInRowHeaders,
    afterOnCellMouseDown: changeCheckboxCell,
    beforeRenderer: addClassesToRows,
    licenseKey: "non-commercial-and-evaluation"
  });

  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
