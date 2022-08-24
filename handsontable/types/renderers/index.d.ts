import { autocompleteRenderer, RENDERER_TYPE as AUTOCOMPLETE_RENDERER } from './autocompleteRenderer';
import { baseRenderer, RENDERER_TYPE as BASE_RENDERER } from './baseRenderer';
import { checkboxRenderer, RENDERER_TYPE as CHECKBOX_RENDERER } from './checkboxRenderer';
import { htmlRenderer, RENDERER_TYPE as HTML_RENDERER } from './htmlRenderer';
import { numericRenderer, RENDERER_TYPE as NUMERIC_RENDERER } from './numericRenderer';
import { passwordRenderer, RENDERER_TYPE as PASSWORD_RENDERER } from './passwordRenderer';
import { textRenderer, RENDERER_TYPE as TEXT_RENDERER } from './textRenderer';
import { timeRenderer, RENDERER_TYPE as TIME_RENDERER } from './timeRenderer';

export function registerAllRenderers(): void;

export interface Renderers {
  autocomplete: typeof autocompleteRenderer;
  base: typeof baseRenderer;
  checkbox: typeof checkboxRenderer;
  html: typeof htmlRenderer;
  numeric: typeof numericRenderer;
  password: typeof passwordRenderer;
  text: typeof textRenderer;
  time: typeof timeRenderer;
}

/**
 * The default renderer aliases the table has built-in.
 */
export type RendererType = keyof Renderers;

export {
  autocompleteRenderer, AUTOCOMPLETE_RENDERER,
  baseRenderer, BASE_RENDERER,
  checkboxRenderer, CHECKBOX_RENDERER,
  htmlRenderer, HTML_RENDERER,
  numericRenderer, NUMERIC_RENDERER,
  passwordRenderer, PASSWORD_RENDERER,
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
