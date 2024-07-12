import { autocompleteRenderer, RENDERER_TYPE as AUTOCOMPLETE_RENDERER } from './autocompleteRenderer';
import { dropdownRenderer, RENDERER_TYPE as DROPDOWN_RENDERER } from './dropdownRenderer';
import { baseRenderer, RENDERER_TYPE as BASE_RENDERER } from './baseRenderer';
import { dateRenderer, RENDERER_TYPE as DATE_RENDERER } from './dateRenderer';
import { checkboxRenderer, RENDERER_TYPE as CHECKBOX_RENDERER } from './checkboxRenderer';
import { handsontableRenderer, RENDERER_TYPE as HANDSONTABLE_RENDERER } from "./handsontableRenderer";
import { htmlRenderer, RENDERER_TYPE as HTML_RENDERER } from './htmlRenderer';
import { numericRenderer, RENDERER_TYPE as NUMERIC_RENDERER } from './numericRenderer';
import { passwordRenderer, RENDERER_TYPE as PASSWORD_RENDERER } from './passwordRenderer';
import { selectRenderer, RENDERER_TYPE as SELECT_RENDERER } from './selectRenderer';
import { textRenderer, RENDERER_TYPE as TEXT_RENDERER } from './textRenderer';
import { timeRenderer, RENDERER_TYPE as TIME_RENDERER } from './timeRenderer';

export function registerAllRenderers(): void;

export interface Renderers {
  autocomplete: typeof autocompleteRenderer;
  dropdown: typeof dropdownRenderer;
  base: typeof baseRenderer;
  checkbox: typeof checkboxRenderer;
  date: typeof dateRenderer;
  handsontable: typeof handsontableRenderer;
  html: typeof htmlRenderer;
  numeric: typeof numericRenderer;
  password: typeof passwordRenderer;
  select: typeof selectRenderer;
  text: typeof textRenderer;
  time: typeof timeRenderer;
}

/**
 * The default renderer aliases the table has built-in.
 */
export type RendererType = keyof Renderers;

export {
  autocompleteRenderer, AUTOCOMPLETE_RENDERER,
  dropdownRenderer, DROPDOWN_RENDERER,
  baseRenderer, BASE_RENDERER,
  checkboxRenderer, CHECKBOX_RENDERER,
  dateRenderer, DATE_RENDERER,
  handsontableRenderer, HANDSONTABLE_RENDERER,
  htmlRenderer, HTML_RENDERER,
  numericRenderer, NUMERIC_RENDERER,
  passwordRenderer, PASSWORD_RENDERER,
  selectRenderer, SELECT_RENDERER,
  textRenderer, TEXT_RENDERER,
  timeRenderer, TIME_RENDERER
};
export {
  getRegisteredRendererNames,
  getRegisteredRenderers,
  getRenderer,
  hasRenderer,
  registerRenderer
} from './registry';
export { BaseRenderer } from './base';
