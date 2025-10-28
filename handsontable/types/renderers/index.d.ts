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
import { CellProperties } from '../settings';
import Core from '../core';

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

/**
 * Factory function for creating custom Handsontable cell renderers.
 *
 * This factory simplifies the creation of custom cell renderers by wrapping the standard
 * Handsontable renderer function signature with a more convenient object-based callback.
 *
 * @param {Function} callback - Function that renders the cell content.
 * @param {object} callback.instance - The Handsontable instance.
 * @param {HTMLElement} callback.td - The table cell element to render into.
 * @param {number} callback.row - The row index of the cell.
 * @param {number} callback.column - The column index of the cell.
 * @param {string|number} callback.prop - The property name or column index.
 * @param {*} callback.value - The current value of the cell.
 * @param {object} callback.cellProperties - The cell's configuration properties.
 *
 * @returns {Function} A renderer function compatible with Handsontable's renderer API.
 *
 * @example
 * ```typescript
 * const myRenderer = rendererFactory(({ td, value, cellProperties }) => {
 *   td.innerHTML = '';
 *   const div = document.createElement('div');
 *   div.textContent = value || '';
 *   div.style.color = cellProperties.customColor || 'black';
 *   td.appendChild(div);
 * });
 *
 * // Use in column definition
 * const columns = [{
 *   data: 'myColumn',
 *   renderer: myRenderer
 * }];
 * ```
 */
export declare const factory: (callback: ({ instance, td, row, column, prop, value, cellProperties }: {
  instance: Core;
  td: HTMLTableCellElement;
  row: number;
  column: number;
  prop: string | number;
  value: any;
  cellProperties: CellProperties;
}) => void) => (instance: Core, 
  td: HTMLTableCellElement, 
  row: number, 
  column: number, 
  prop: string | number, 
  value: any, 
  cellProperties: CellProperties) => void;
