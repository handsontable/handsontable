import { arrayEach, arrayMap } from '../../../helpers/array';
import * as C from '../../../i18n/constants';

/**
 * @param {HiddenRows} hiddenRowsPlugin The plugin instance.
 * @returns {object}
 */
export default function showRowItem(hiddenRowsPlugin) {
  const rows = [];

  return {
    key: 'hidden_rows_show',
    name() {
      const pluralForm = rows.length > 1 ? 1 : 0;

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_SHOW_ROW, pluralForm);
    },
    callback() {
      const selectedRangeLast = this.getSelectedRangeLast();
      const visualStartRow = selectedRangeLast.getTopLeftCorner().row;
      const visualEndRow = selectedRangeLast.getBottomRightCorner().row;
      const rowIndexMapper = this.rowIndexMapper;
      const noVisibleIndexesBefore =
        rowIndexMapper.getFirstNotHiddenIndex(visualStartRow - 1, -1) === null;
      const onlyFirstVisibleRowSelected = noVisibleIndexesBefore && visualStartRow === visualEndRow;
      const noVisibleIndexesAfter =
        rowIndexMapper.getFirstNotHiddenIndex(visualEndRow + 1, 1) === null;
      const onlyLastVisibleRowSelected = noVisibleIndexesAfter && visualStartRow === visualEndRow;

      let startPhysicalRow = this.toPhysicalRow(visualStartRow);
      let endPhysicalRow = this.toPhysicalRow(visualEndRow);

      if (onlyFirstVisibleRowSelected) {
        startPhysicalRow = 0;
      }

      if (onlyLastVisibleRowSelected) {
        endPhysicalRow = this.countSourceRows() - 1; // All rows after the selected row will be shown.
      }

      hiddenRowsPlugin.showRows(rows);

      const startVisualRowAfterAction = this.toVisualRow(startPhysicalRow);
      const endVisualRowAfterAction = this.toVisualRow(endPhysicalRow);

      const allRowsSelected = endVisualRowAfterAction - startVisualRowAfterAction + 1 === this.countRows();
      // TODO: Workaround, because selection doesn't select headers properly in a case when we select all rows
      // from `0` to `n`, where `n` is number of rows in the `DataMap`.
      const selectionStart = allRowsSelected ? -1 : startVisualRowAfterAction;

      // We render rows at first. It was needed for getting fixed rows.
      // Please take a look at #6864 for broader description.
      this.render();
      this.view.wt.wtOverlays.adjustElementsSizes(true);

      // Selection start and selection end coordinates might be changed after showing some items.
      this.selectRows(selectionStart, endVisualRowAfterAction);
    },
    disabled: false,
    hidden() {
      const hiddenPhysicalRows = arrayMap(hiddenRowsPlugin.getHiddenRows(), (visualRowIndex) => {
        return this.toPhysicalRow(visualRowIndex);
      });

      if (!this.selection.isSelectedByRowHeader() || hiddenPhysicalRows.length < 1) {
        return true;
      }

      rows.length = 0;

      const selectedRangeLast = this.getSelectedRangeLast();
      const visualStartRow = selectedRangeLast.getTopLeftCorner().row;
      const visualEndRow = selectedRangeLast.getBottomRightCorner().row;
      const rowIndexMapper = this.rowIndexMapper;
      const renderableStartRow = rowIndexMapper.getRenderableFromVisualIndex(visualStartRow);
      const renderableEndRow = rowIndexMapper.getRenderableFromVisualIndex(visualEndRow);
      const notTrimmedRowIndexes = rowIndexMapper.getNotTrimmedIndexes();
      const physicalRowIndexes = [];

      if (visualStartRow !== visualEndRow) {
        const visualRowsInRange = visualEndRow - visualStartRow + 1;
        const renderedRowsInRange = renderableEndRow - renderableStartRow + 1;

        // Collect not trimmed rows if there are some hidden rows in the selection range.
        if (visualRowsInRange > renderedRowsInRange) {
          const physicalIndexesInRange = notTrimmedRowIndexes.slice(visualStartRow, visualEndRow + 1);

          physicalRowIndexes.push(...physicalIndexesInRange.filter(physicalIndex => hiddenPhysicalRows.includes(physicalIndex)));
        }

      // Handled row is the first rendered index and there are some visual indexes before it.
      } else if (renderableStartRow === 0 && renderableStartRow < visualStartRow) {
        // not trimmed indexes -> array of mappings from visual (native array's index) to physical indexes (value).
        physicalRowIndexes.push(...notTrimmedRowIndexes.slice(0, visualStartRow)); // physical indexes

      // When all rows are hidden and the context menu is triggered using top-left corner.
      } else if (renderableStartRow === null) {
        // Show all hidden rows.
        physicalRowIndexes.push(...notTrimmedRowIndexes.slice(0, this.countRows()));

      } else {
        const lastVisualIndex = this.countRows() - 1;
        const lastRenderableIndex = rowIndexMapper.getRenderableFromVisualIndex(
          rowIndexMapper.getFirstNotHiddenIndex(lastVisualIndex, -1)
        );

        // Handled row is the last rendered index and there are some visual indexes after it.
        if (renderableEndRow === lastRenderableIndex && lastVisualIndex > visualEndRow) {
          physicalRowIndexes.push(...notTrimmedRowIndexes.slice(visualEndRow + 1));
        }
      }

      arrayEach(physicalRowIndexes, (physicalRowIndex) => {
        rows.push(this.toVisualRow(physicalRowIndex));
      });

      return rows.length === 0;
    }
  };
}
