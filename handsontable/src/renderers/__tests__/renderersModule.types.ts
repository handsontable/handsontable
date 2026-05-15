import {
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
registerRenderer('custom', (
  hot: unknown, TD: HTMLTableCellElement, row: number, column: number,
  prop: unknown, value: unknown, cellProperties: unknown
) => { });
rendererFactory(({ instance, td, row, column, prop, value, cellProperties }) => {
  const _instance: object = instance;
  const _td: HTMLTableCellElement = td;
  const _row: number = row;
  const _column: number = column;
  const _prop: string | number = prop;
  const _value: unknown = value;
  const _cellProperties: Record<string, unknown> = cellProperties;
});

const base: Function = getRenderer('base');
const autocomplete: Function = getRenderer('autocomplete');
const checkbox: Function = getRenderer('checkbox');
const html: Function = getRenderer('html');
const numeric: Function = getRenderer('numeric');
const password: Function = getRenderer('password');
const text: Function = getRenderer('text');
const time: Function = getRenderer('time');
const custom: Function = getRenderer('custom');
