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

const base: BaseRenderer = getRenderer('base');
const autocomplete: BaseRenderer = getRenderer('autocomplete');
const checkbox: BaseRenderer = getRenderer('checkbox');
const html: BaseRenderer = getRenderer('html');
const numeric: BaseRenderer = getRenderer('numeric');
const password: BaseRenderer = getRenderer('password');
const text: BaseRenderer = getRenderer('text');
const time: BaseRenderer = getRenderer('time');
const custom: BaseRenderer = getRenderer('custom');
