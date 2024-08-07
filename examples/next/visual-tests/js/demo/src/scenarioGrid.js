import Handsontable from 'handsontable/base';
import 'handsontable/dist/handsontable.css';
import '@handsontable/pikaday/css/pikaday.css';
import { scenarioDataTop, scenarioDataBottom } from './constants';

import { isArabicDemoEnabled } from './utils';
import './styles.css';
import { registerLanguageDictionary, arAR } from 'handsontable/i18n';

// choose cell types you want to use and import them
import {
  registerCellType,
  CheckboxCellType,
  DateCellType,
  DropdownCellType,
  NumericCellType,
} from 'handsontable/cellTypes';

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

export function initializeScenarioGrid() {
  const root = document.getElementById('root');

  const topTable = document.createElement('div');
  topTable.id = 'tableTop';

  const input1 = document.createElement('input');
  input1.style.margin = '10px';
  input1.placeholder = 'Input 1';
  topTable.appendChild(input1);

  const example1 = document.createElement('div');
  topTable.appendChild(example1);

  root.appendChild(topTable);

  const bottomTable = document.createElement('div');
  bottomTable.id = 'tableBottom';

  const input2 = document.createElement('input');
  input2.style.margin = '10px';
  input2.placeholder = 'Input 2';
  bottomTable.appendChild(input2);

  const example2 = document.createElement('div');
  bottomTable.appendChild(example2);

  root.appendChild(bottomTable);

  new Handsontable(example1, {
    data: scenarioDataTop,
    layoutDirection: isArabicDemoEnabled() ? 'rtl' : 'ltr',
    language: isArabicDemoEnabled() ? arAR.languageCode : 'en-US',
    height: 350,
    colHeaders:true,
    nestedHeaders:[
      [
        { label: 'Product', colspan: 4 },
        { label: 'Category', colspan: 3 },
        { label: 'User', colspan: 2 },
        { label: 'System', colspan: 2 },
      ],
      [
        'Product ID',
        'Mobile Apps',
        'Pricing',
        'Rating',
        'Data Type',
        'Industry',
        'Business Scale',
        'User Type',
        'No of Users',
        'Deployment',
        'OS',
      ],
    ],
    collapsibleColumns: true,
    columns: [
      { data: 'product_id', type: 'numeric' },
      { data: 'mobile_apps', type: 'text' },
      { data: 'pricing', type: 'text' },
      { data: 'rating', type: 'numeric' },
      { data: 'dataType', type: 'text' },
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
      indicators: true,
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
    autoWrapCol: true,
    autoWrapRow: true,
    fixedRowsBottom: 2,
    licenseKey: 'non-commercial-and-evaluation',
  });

  new Handsontable(example2, {
    data: scenarioDataBottom,
    layoutDirection: isArabicDemoEnabled() ? 'rtl' : 'ltr',
    language: isArabicDemoEnabled() ? arAR.languageCode : 'en-US',
    height: 250,
    colHeaders: [
      'Category',
      'Product ID',
      'Industry',
      'Business Scale',
      'User Type',
      'No of Users',
      'Deployment',
      'OS',
      'Mobile Apps',
      'Pricing',
      'Rating',
    ],
    columnSummary: [
      {
        sourceColumn: 10,
        type: 'average',
        destinationRow: 0,
        destinationColumn: 10,
        // force this column summary to treat non-numeric values as numeric values
        forceNumeric: true
      },
    ],
    columns: [
      { data: 'category', type: 'text' },
      { data: 'product_id', type: 'numeric' },
      { data: 'industry', type: 'text' },
      { data: 'business_scale', type: 'text' },
      { data: 'user_type', type: 'text' },
      { data: 'no_of_users', type: 'text' },
      { data: 'deployment', type: 'text' },
      { data: 'OS', type: 'text' },
      { data: 'mobile_apps', type: 'text' },
      { data: 'pricing', type: 'text' },
      { data: 'rating', type: 'numeric' },
    ],
    mergeCells: true,
    dropdownMenu: true,
    hiddenColumns: {
      indicators: true,
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
    autoWrapCol: true,
    autoWrapRow: true,
    nestedRows: true,
    bindRowsWithHeaders: true,
    licenseKey: 'non-commercial-and-evaluation',
  });

  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
