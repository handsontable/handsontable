import { autocompleteRenderer } from '../autocompleteRenderer';
import { deprecatedWarn } from '../../helpers/console';

export const RENDERER_TYPE = 'date';
const deprecatedMessageShown = new WeakSet();

/**
 * Handsontable renderer.
 *
 * @private
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
 */
export function dateRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  if (!deprecatedMessageShown.has(cellProperties.instance) && typeof cellProperties.dateFormat === 'string') {
    deprecatedMessageShown.add(cellProperties.instance);
    deprecatedWarn(
      'The `date` cell type with string-based `dateFormat` (moment.js) is deprecated. ' +
      'In the next major release, `date` will accept only Intl.DateTimeFormat options (object). ' +
      'To start migrating, use the `intlDate` cell type now; it will become the `date` cell type ' +
      'after the next major release (the `intlDate` will become an alias for `date`).\n\n' +
      'Migration guide: https://handsontable.com/docs/migration-from-16.2-to-17.0/\n' +
      '`date` cell type: https://handsontable.com/docs/date-cell-type/'
    );
  }

  autocompleteRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

dateRenderer.RENDERER_TYPE = RENDERER_TYPE;
