import Handsontable from 'handsontable';
import {
  BaseRenderer,
  autocompleteRenderer,
  baseRenderer,
  checkboxRenderer,
  htmlRenderer,
  numericRenderer,
  passwordRenderer,
  textRenderer,
  timeRenderer,

  getRenderer,
  registerAllRenderers,
  registerRenderer,
  rendererFactory,
} from 'handsontable/renderers';

registerAllRenderers();

registerRenderer(baseRenderer);
registerRenderer(autocompleteRenderer);
registerRenderer(checkboxRenderer);
registerRenderer(htmlRenderer);
registerRenderer(numericRenderer);
registerRenderer(passwordRenderer);
registerRenderer(textRenderer);
registerRenderer(timeRenderer);
registerRenderer('custom', (hot, TD, row, column, prop, value, cellProperties) => { });
rendererFactory(({ instance, td, row, column, prop, value, cellProperties }) => {
  const _instance: Handsontable = instance;
  const _td: HTMLTableCellElement = td;
  const _row: number = row;
  const _column: number = column;
  const _prop: string | number = prop;
  const _value: any = value;
  const _cellProperties: Handsontable.CellProperties = cellProperties;
});

const base: BaseRenderer = getRenderer('base');
const autocomplete: BaseRenderer = getRenderer('autocomplete');
const checkbox: BaseRenderer = getRenderer('checkbox');
const html: BaseRenderer = getRenderer('html');
const numeric: BaseRenderer = getRenderer('numeric');
const password: BaseRenderer = getRenderer('password');
const text: BaseRenderer = getRenderer('text');
const time: BaseRenderer = getRenderer('time');
const custom: BaseRenderer = getRenderer('custom');
