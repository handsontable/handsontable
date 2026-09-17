import type { HotInstance } from '../../../core/types';
import { arrayEach, arrayMap } from '../../../helpers/array';
import * as C from '../../../i18n/constants';
import { collectAdjacentHiddenPhysicalIndexes } from '../../../utils/hiddenIndexes';

/**
 * @param {HiddenRows} hiddenRowsPlugin The plugin instance.
 * @returns {object}
 */
export default function showRowItem(hiddenRowsPlugin: Record<string, Function>) {
  const rows: number[] = [];

  return {
    key: 'hidden_rows_show',
    name(this: HotInstance): string {
      const pluralForm = rows.length > 1 ? 1 : 0;

      return (this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_SHOW_ROW, pluralForm) as string);
    },
    callback(this: HotInstance) {
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

      this.render();

      const allRowsSelected = endVisualRow - startVisualRow + 1 === this.countRows();

      // When all headers needs to be selected then do nothing. The header selection is
      // automatically handled by corner click.
      if (!allRowsSelected) {
        this.selectRows(startVisualRow, endVisualRow);
      }
    },
    disabled: false,
    hidden(this: HotInstance) {
      const hiddenPhysicalRows = arrayMap(hiddenRowsPlugin.getHiddenRows(), (visualRowIndex): number | null => {
        return this.toPhysicalRow(visualRowIndex as number);
      });

      if (!(this.selection.isSelectedByRowHeader() || this.selection.isSelectedByCorner()) ||
        hiddenPhysicalRows.length < 1) {
        return true;
      }

      rows.length = 0;

      const selectedRangeActive = this.getSelectedRangeActive();

      if (!selectedRangeActive) {
        return true;
      }

      const visualStartRow = selectedRangeActive.getTopStartCorner().row;
      const visualEndRow = selectedRangeActive.getBottomEndCorner().row;

      const rowIndexMapper = this.rowIndexMapper;
      const renderableStartRow = visualStartRow !== null
        ? rowIndexMapper.getRenderableFromVisualIndex(visualStartRow)
        : null;
      const renderableEndRow = visualEndRow !== null
        ? rowIndexMapper.getRenderableFromVisualIndex(visualEndRow)
        : null;
      const notTrimmedRowIndexes = rowIndexMapper.getNotTrimmedIndexes();
      const hiddenPhysicalLookup = new Set(
        hiddenPhysicalRows.filter((physical): physical is number => typeof physical === 'number')
      );
      const physicalRowIndexes: number[] = [];

      if (visualStartRow !== visualEndRow) {
        if (visualStartRow === null || visualEndRow === null) {
          return true;
        }

        const visualRowsInRange = visualEndRow - visualStartRow + 1;
        const renderedRowsInRange = (renderableEndRow ?? 0) - (renderableStartRow ?? 0) + 1;

        // Collect not trimmed rows if there are some hidden rows in the selection range.
        if (visualRowsInRange > renderedRowsInRange) {
          const physicalIndexesInRange = notTrimmedRowIndexes.slice(visualStartRow, visualEndRow + 1);

          physicalIndexesInRange.forEach((physicalIndex: number) => {
            if (hiddenPhysicalLookup.has(physicalIndex)) {
              physicalRowIndexes.push(physicalIndex);
            }
          });
        }

        // When all rows are hidden and the context menu is triggered using top-left corner.
      } else if (renderableStartRow === null) {
        arrayEach(notTrimmedRowIndexes.slice(0, this.countRows()), (physicalIndex) => {
          physicalRowIndexes.push(physicalIndex);
        });

      } else if (visualStartRow !== null) {
        collectAdjacentHiddenPhysicalIndexes(
          visualStartRow,
          this.countRows(),
          notTrimmedRowIndexes,
          hiddenPhysicalLookup,
          physicalRowIndexes,
        );
      }

      arrayEach(physicalRowIndexes, (physicalRowIndex) => {
        rows.push(this.toVisualRow(physicalRowIndex));
      });

      return rows.length === 0;
    }
  };
}
