import Handsontable from 'handsontable/base';

import { generateExampleData, getDirectionFromURL, getThemeNameFromURL } from '../../utils';
import { progressBarRenderer, starRenderer } from './customRenderers';
import { registerLanguageDictionary, arAR } from 'handsontable/i18n';
import {
  addClassesToRows,
  changeCheckboxCell,
  drawCheckboxInRowHeaders
} from './hooksCallbacks';

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

const root = document.getElementById('root');
const example = document.createElement('hot-table');

root.appendChild(example);

export function init() {
  const template = document.createElement('template');

  template.innerHTML = '<div id="container"></div>';

  class HotTableComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      document.querySelectorAll('[rel=stylesheet]').forEach((link) => {
        this.shadowRoot.appendChild(link.cloneNode());
      });

      this.hot = new Handsontable(this.shadowRoot.querySelector('#container'), {
        data: generateExampleData(),
        layoutDirection: getDirectionFromURL(),
        language: getDirectionFromURL() === 'rtl' ? arAR.languageCode : 'en-US',
        themeName: getThemeNameFromURL(),
        height: 450,
        colWidths: [140, 210, 135, 100, 90, 110, 120, 115, 140],
        colHeaders: [
          'Company name',
          'Name',
          'Sell date',
          'In stock',
          'Qty',
          'Progress',
          'Rating',
          'Order ID',
          'Country'
        ],
        columns: [
          { data: 1, type: 'text' },
          { data: 3, type: 'text' },
          {
            data: 4,
            type: 'date',
            allowInvalid: false,
            dateFormat: getDirectionFromURL() === 'rtl' ? 'M/D/YYYY' : 'DD/MM/YYYY',
          },
          {
            data: 6,
            type: 'checkbox',
            className: 'htCenter',
            headerClassName: 'htCenter'
          },
          {
            data: 7,
            type: 'numeric',
            headerClassName: 'htRight'
          },
          {
            data: 8,
            renderer: progressBarRenderer,
            editor: false,
            className: 'htMiddle'
          },
          {
            data: 9,
            renderer: starRenderer,
            editor: false,
            className: 'star htCenter',
            headerClassName: 'htCenter'
          },
          { data: 5, type: 'text' },
          { data: 2, type: 'text' }
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
        headerClassName: getDirectionFromURL() === 'rtl' ? 'htRight' : 'htLeft',
        afterGetRowHeader: drawCheckboxInRowHeaders,
        afterOnCellMouseDown: changeCheckboxCell,
        beforeRenderer: addClassesToRows,
        licenseKey: 'non-commercial-and-evaluation'
      });
    }
  }

  customElements.define('hot-table', HotTableComponent);
  console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`);
}
