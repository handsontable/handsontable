/**
 * Factory function for creating custom Handsontable cell renderers.
 *
 * This factory simplifies the creation of custom cell renderers by wrapping the standard
 * Handsontable renderer function signature with a more convenient object-based callback.
 *
 * @param {Function} callback Function that renders the cell content.
 * @param {object} callback.instance The Handsontable instance.
 * @param {HTMLElement} callback.td The table cell element to render into.
 * @param {number} callback.row The row index of the cell.
 * @param {number} callback.column The column index of the cell.
 * @param {string|number} callback.prop The property name or column index.
 * @param {*} callback.value The current value of the cell.
 * @param {object} callback.cellProperties The cell's configuration properties.
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
export const rendererFactory = (callback) => {
  return (instance, td, row, column, prop, value, cellProperties) => {
    return callback({ instance, td, row, column, prop, value, cellProperties });
  };
};
