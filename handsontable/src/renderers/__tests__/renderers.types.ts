import Handsontable from 'handsontable';
import type { HotInstance } from 'handsontable';
import {
  autocompleteRenderer,
  baseRenderer,
  checkboxRenderer,
  dropdownRenderer,
  htmlRenderer,
  handsontableRenderer,
  numericRenderer,
  passwordRenderer,
  selectRenderer,
  textRenderer,
  timeRenderer,
  dateRenderer,
  getRenderer,
  registerRenderer,
  rendererFactory,
} from 'handsontable/renderers';

interface CellProperties {
  row: number;
  col: number;
  instance: HotInstance;
  visualRow: number;
  visualCol: number;
  prop: string | number;
  [key: string]: unknown;
}

const elem = document.createElement('div');
const hot: HotInstance = Handsontable(elem, {});

const cellProperties: CellProperties = {
  row: 0,
  col: 0,
  instance: hot,
  visualRow: 0,
  visualCol: 0,
  prop: 'foo'
};

const TD = document.createElement('td');

// Verify the built-in renderers exist and have the correct signature
autocompleteRenderer(hot, TD, 0, 0, 'prop', 1.235, cellProperties);
dropdownRenderer(hot, TD, 0, 0, 'prop', 1.235, cellProperties);
baseRenderer(hot, TD, 0, 0, 'prop', 1.235, cellProperties);
checkboxRenderer(hot, TD, 0, 0, 'prop', 1.235, cellProperties);
htmlRenderer(hot, TD, 0, 0, 'prop', 1.235);
handsontableRenderer(hot, TD, 0, 0, 'prop', 1.235, cellProperties);
numericRenderer(hot, TD, 0, 0, 'prop', 1.235, cellProperties);
passwordRenderer(hot, TD, 0, 0, 'prop', 1.235);
selectRenderer(hot, TD, 0, 0, 'prop', 1.235, cellProperties);
textRenderer(hot, TD, 0, 0, 'prop', 1.235, cellProperties);
dateRenderer(hot, TD, 0, 0, 'prop', 1.235, cellProperties);
timeRenderer(hot, TD, 0, 0, 'prop', 1.235, cellProperties);

// Verify top-level renderers API
getRenderer('foo')(hot, TD, 0, 0, 'prop', 1.235, cellProperties);
registerRenderer('foo', (
  hot: HotInstance, TD: HTMLTableCellElement,
  row: number, col: number, prop: string | number, value: unknown, cellProperties: Record<string, unknown>
) => TD);
rendererFactory(({ instance, td, row, column, prop, value, cellProperties }) => {
  const _instance: object = instance;
  const _td: HTMLTableCellElement = td;
  const _row: number = row;
  const _column: number = column;
  const _prop: string | number = prop;
  const _value: unknown = value;
  const _cellProperties: Record<string, unknown> = cellProperties;
})(hot, TD, 0, 0, 'prop', 1.235, cellProperties);
