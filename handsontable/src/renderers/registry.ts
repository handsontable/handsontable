import { staticRegister } from '../utils/staticRegister';
import { throwWithCause } from '../helpers/errors';
import type { CellProperties } from '../settings';
import type { BaseRenderer } from './baseRenderer';
import type { RENDERER_TYPE as AUTOCOMPLETE_RENDERER } from './autocompleteRenderer';
import type { RENDERER_TYPE as BASE_RENDERER } from './baseRenderer';
import type { RENDERER_TYPE as CHECKBOX_RENDERER } from './checkboxRenderer';
import type { RENDERER_TYPE as DATE_RENDERER } from './dateRenderer';
import type { RENDERER_TYPE as DROPDOWN_RENDERER } from './dropdownRenderer';
import type { RENDERER_TYPE as HANDSONTABLE_RENDERER } from './handsontableRenderer';
import type { RENDERER_TYPE as HTML_RENDERER } from './htmlRenderer';
import type { RENDERER_TYPE as INTL_DATE_RENDERER } from './intlDateRenderer';
import type { RENDERER_TYPE as INTL_TIME_RENDERER } from './intlTimeRenderer';
import type { RENDERER_TYPE as MULTI_SELECT_RENDERER } from './multiSelectRenderer';
import type { RENDERER_TYPE as NUMERIC_RENDERER } from './numericRenderer';
import type { RENDERER_TYPE as PASSWORD_RENDERER } from './passwordRenderer';
import type { RENDERER_TYPE as SELECT_RENDERER } from './selectRenderer';
import type { RENDERER_TYPE as TEXT_RENDERER } from './textRenderer';
import type { RENDERER_TYPE as TIME_RENDERER } from './timeRenderer';

const {
  register,
  getItem,
  hasItem,
  getNames,
  getValues,
} = staticRegister('renderers');

/**
 * Retrieve renderer function.
 *
 * @param {string} name Renderer identification.
 * @returns {BaseRenderer} Returns renderer function.
 */
function _getItem(name: string | BaseRenderer): BaseRenderer {
  if (typeof name === 'function') {
    return name;
  }
  if (!hasItem(name)) {
    throwWithCause(`No registered renderer found under "${name}" name`);
  }

  return getItem(name) as BaseRenderer;
}

/**
 * Register renderer under its alias.
 *
 * @param {string|BaseRenderer} name Renderer's alias or renderer function with its descriptor.
 * @param {BaseRenderer} [renderer] Renderer function.
 */
function _register(name: string | (BaseRenderer & { RENDERER_TYPE: string }), renderer?: BaseRenderer): void {
  if (typeof name !== 'string') {
    renderer = name;
    name = name.RENDERER_TYPE;
  }

  register(name, renderer);
}

export {
  _register as registerRenderer,
  _getItem as getRenderer,
  hasItem as hasRenderer,
  getNames as getRegisteredRendererNames,
  getValues as getRegisteredRenderers,
};

/**
 * All built-in renderer type names.
 */
export type RendererType = typeof AUTOCOMPLETE_RENDERER | typeof BASE_RENDERER | typeof CHECKBOX_RENDERER |
  typeof DATE_RENDERER | typeof DROPDOWN_RENDERER | typeof HANDSONTABLE_RENDERER | typeof HTML_RENDERER |
  typeof INTL_DATE_RENDERER | typeof INTL_TIME_RENDERER | typeof MULTI_SELECT_RENDERER | typeof NUMERIC_RENDERER |
  typeof PASSWORD_RENDERER | typeof SELECT_RENDERER | typeof TEXT_RENDERER | typeof TIME_RENDERER | string;

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
type RegistryRendererParams = {
  instance: object; td: HTMLTableCellElement; row: number; column: number;
  prop: string | number; value: unknown; cellProperties: CellProperties;
};

export const rendererFactory = (callback: (params: RegistryRendererParams) => void) => {
  return (
    instance: object, td: HTMLTableCellElement, row: number, column: number,
    prop: string | number, value: unknown, cellProperties: CellProperties): void => {
    return callback({ instance, td, row, column, prop, value, cellProperties });
  };
};
