import { autocompleteRenderer, RENDERER_TYPE as AUTOCOMPLETE_RENDERER } from './autocompleteRenderer';
import { baseRenderer, RENDERER_TYPE as BASE_RENDERER } from './baseRenderer';
export type { BaseRenderer } from './baseRenderer';
import { dropdownRenderer, RENDERER_TYPE as DROPDOWN_RENDERER } from './dropdownRenderer';
import { checkboxRenderer, RENDERER_TYPE as CHECKBOX_RENDERER } from './checkboxRenderer';
import { handsontableRenderer, RENDERER_TYPE as HANDSONTABLE_RENDERER } from './handsontableRenderer';
import { htmlRenderer, RENDERER_TYPE as HTML_RENDERER } from './htmlRenderer';
import { intlDateRenderer, RENDERER_TYPE as INTL_DATE_RENDERER } from './intlDateRenderer';
import { intlTimeRenderer, RENDERER_TYPE as INTL_TIME_RENDERER } from './intlTimeRenderer';
import { numericRenderer, RENDERER_TYPE as NUMERIC_RENDERER } from './numericRenderer';
import { passwordRenderer, RENDERER_TYPE as PASSWORD_RENDERER } from './passwordRenderer';
import { selectRenderer, RENDERER_TYPE as SELECT_RENDERER } from './selectRenderer';
import { textRenderer, RENDERER_TYPE as TEXT_RENDERER } from './textRenderer';
import { timeRenderer, RENDERER_TYPE as TIME_RENDERER } from './timeRenderer';
import { dateRenderer, RENDERER_TYPE as DATE_RENDERER } from './dateRenderer';
import { registerRenderer } from './registry';

/**
 * Registers all available renderers.
 */
export function registerAllRenderers() {
  registerRenderer(autocompleteRenderer);
  registerRenderer(baseRenderer);
  registerRenderer(checkboxRenderer);
  registerRenderer(dropdownRenderer);
  registerRenderer(handsontableRenderer);
  registerRenderer(htmlRenderer);
  registerRenderer(intlDateRenderer);
  registerRenderer(intlTimeRenderer);
  registerRenderer(numericRenderer);
  registerRenderer(passwordRenderer);
  registerRenderer(selectRenderer);
  registerRenderer(textRenderer);
  registerRenderer(timeRenderer);
  registerRenderer(dateRenderer);
}

export {
  autocompleteRenderer, AUTOCOMPLETE_RENDERER,
  baseRenderer, BASE_RENDERER,
  dropdownRenderer, DROPDOWN_RENDERER,
  checkboxRenderer, CHECKBOX_RENDERER,
  handsontableRenderer, HANDSONTABLE_RENDERER,
  htmlRenderer, HTML_RENDERER,
  intlDateRenderer, INTL_DATE_RENDERER,
  intlTimeRenderer, INTL_TIME_RENDERER,
  numericRenderer, NUMERIC_RENDERER,
  passwordRenderer, PASSWORD_RENDERER,
  selectRenderer, SELECT_RENDERER,
  textRenderer, TEXT_RENDERER,
  timeRenderer, TIME_RENDERER,
  dateRenderer, DATE_RENDERER,
};

export {
  getRegisteredRendererNames,
  getRegisteredRenderers,
  getRenderer,
  hasRenderer,
  registerRenderer,
} from './registry';
export { rendererFactory } from './factory';

/**
 * All built-in renderer type names.
 */
export type RendererType = typeof AUTOCOMPLETE_RENDERER | typeof BASE_RENDERER | typeof CHECKBOX_RENDERER |
  typeof DROPDOWN_RENDERER | typeof HANDSONTABLE_RENDERER | typeof HTML_RENDERER | typeof INTL_DATE_RENDERER |
  typeof INTL_TIME_RENDERER | typeof NUMERIC_RENDERER | typeof PASSWORD_RENDERER | typeof SELECT_RENDERER |
  typeof TEXT_RENDERER | typeof TIME_RENDERER | typeof DATE_RENDERER | string;
