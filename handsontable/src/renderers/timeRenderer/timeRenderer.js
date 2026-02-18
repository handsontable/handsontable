import { textRenderer } from '../textRenderer';
import { deprecatedWarn } from '../../helpers/console';

export const RENDERER_TYPE = 'time';
const deprecatedMessageShown = new WeakSet();

/**
 * Default time renderer.
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
export function timeRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  if (!deprecatedMessageShown.has(cellProperties.instance) && typeof cellProperties.timeFormat === 'string') {
    deprecatedMessageShown.add(cellProperties.instance);
    deprecatedWarn(
      'The `time` cell type with string-based `timeFormat` (moment.js) is deprecated. ' +
      'In the next major release, `time` will accept only Intl.DateTimeFormat options (object). ' +
      'To start migrating, use the `intlTime` cell type now; it will become the `time` cell type ' +
      'after the next major release (the `intlTime` will become an alias for `time`).\n\n' +
      'Migration guide: https://handsontable.com/docs/migration-from-16.2-to-17.0/\n' +
      '`time` cell type: https://handsontable.com/docs/time-cell-type/'
    );
  }

  textRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);

  TD.dir = 'ltr';
}

timeRenderer.RENDERER_TYPE = RENDERER_TYPE;
