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
      if (rows.length === 0) {
        return;
      }

      let startVisualRow = rows[0];
      let endVisualRow = rows[rows.length - 1];

      // Add to the selection one more visual row on the top.
      startVisualRow = this.rowIndexMapper
        .getNearestNotHiddenIndex(startVisualRow - 1, -1) ?? 0;
      // Add to the selection one more visual row on the bottom.
      endVisualRow = this.rowIndexMapper
        .getNearestNotHiddenIndex(endVisualRow + 1, 1) ?? this.countRows() - 1;

      hiddenRowsPlugin.showRows(rows);

      // We render rows at first. It was needed for getting fixed rows.
      // Please take a look at #6864 for broader description.
      this.render();
      this.view.adjustElementsSize();

      const allRowsSelected = endVisualRow - startVisualRow + 1 === this.countRows();

      // When all headers needs to be selected then do nothing. The header selection is
      // automatically handled by corner click.
      if (!allRowsSelected) {
        this.selectRows(startVisualRow, endVisualRow);
      }
    },
    disabled: false,
    hidden() {
      const hiddenPhysicalRows = arrayMap(hiddenRowsPlugin.getHiddenRows(), (visualRowIndex) => {
        return this.toPhysicalRow(visualRowIndex);
      });

      if (!(this.selection.isSelectedByRowHeader() || this.selection.isSelectedByCorner()) ||
        hiddenPhysicalRows.length < 1) {
        return true;
      }

      rows.length = 0;

      const selectedRangeLast = this.getSelectedRangeLast();
      const visualStartRow = selectedRangeLast.getTopStartCorner().row;
      const visualEndRow = selectedRangeLast.getBottomEndCorner().row;
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

          physicalRowIndexes.push(
            ...physicalIndexesInRange.filter(physicalIndex => hiddenPhysicalRows.includes(physicalIndex))
          );
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
          rowIndexMapper.getNearestNotHiddenIndex(lastVisualIndex, -1)
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
