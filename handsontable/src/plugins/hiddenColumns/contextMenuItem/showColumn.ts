import { arrayEach, arrayMap } from '../../../helpers/array';
import * as C from '../../../i18n/constants';
import type { HotInstance } from '../../../core/types';
import { collectAdjacentHiddenPhysicalIndexes } from '../../../utils/hiddenIndexes';

/**
 * @param {HiddenColumns} hiddenColumnsPlugin The plugin instance.
 * @returns {object}
 */
export default function showColumnItem(hiddenColumnsPlugin: Record<string, Function>) {
  const columns: number[] = [];

  return {
    key: 'hidden_columns_show',
    name(this: HotInstance): string {
      const pluralForm = columns.length > 1 ? 1 : 0;

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_SHOW_COLUMN, pluralForm) as string;
    },
    callback(this: HotInstance) {
      if (columns.length === 0) {
        return;
      }

      let startVisualColumn = columns[0];
      let endVisualColumn = columns[columns.length - 1];

      // Add to the selection one more visual column on the left.
      startVisualColumn = this.columnIndexMapper
        .getNearestNotHiddenIndex(startVisualColumn - 1, -1) ?? 0;
      // Add to the selection one more visual column on the right.
      endVisualColumn = this.columnIndexMapper
        .getNearestNotHiddenIndex(endVisualColumn + 1, 1) ?? this.countCols() - 1;

      hiddenColumnsPlugin.showColumns(columns);

      this.render();

      const allColumnsSelected = endVisualColumn - startVisualColumn + 1 === this.countCols();

      // When all headers needs to be selected then do nothing. The header selection is
      // automatically handled by corner click.
      if (!allColumnsSelected) {
        this.selectColumns(startVisualColumn, endVisualColumn);
      }
    },
    disabled: false,
    hidden(this: HotInstance) {
      const hiddenPhysicalColumns = arrayMap(
        hiddenColumnsPlugin.getHiddenColumns(),
        (visualColumnIndex): number | null => {
          return this.toPhysicalColumn(visualColumnIndex as number);
        }
      );

      if (!(this.selection.isSelectedByColumnHeader() || this.selection.isSelectedByCorner()) ||
          hiddenPhysicalColumns.length < 1) {
        return true;
      }

      columns.length = 0;

      const selectedRangeActive = this.getSelectedRangeActive();

      if (!selectedRangeActive) {
        return true;
      }

      const visualStartColumn = selectedRangeActive.getTopStartCorner().col;
      const visualEndColumn = selectedRangeActive.getBottomEndCorner().col;

      const columnIndexMapper = this.columnIndexMapper;
      const renderableStartColumn = visualStartColumn !== null
        ? columnIndexMapper.getRenderableFromVisualIndex(visualStartColumn)
        : null;
      const renderableEndColumn = visualEndColumn !== null
        ? columnIndexMapper.getRenderableFromVisualIndex(visualEndColumn)
        : null;
      const notTrimmedColumnIndexes = columnIndexMapper.getNotTrimmedIndexes();
      const hiddenPhysicalLookup = new Set(
        hiddenPhysicalColumns.filter((physical): physical is number => typeof physical === 'number')
      );
      const physicalColumnIndexes: number[] = [];

      if (visualStartColumn !== visualEndColumn) {
        if (visualStartColumn === null || visualEndColumn === null) {
          return true;
        }

        const visualColumnsInRange = visualEndColumn - visualStartColumn + 1;
        const renderedColumnsInRange = (renderableEndColumn ?? 0) - (renderableStartColumn ?? 0) + 1;

        // Collect not trimmed columns if there are some hidden columns in the selection range.
        if (visualColumnsInRange > renderedColumnsInRange) {
          const physicalIndexesInRange = notTrimmedColumnIndexes.slice(visualStartColumn, visualEndColumn + 1);

          physicalIndexesInRange.forEach((physicalIndex: number) => {
            if (hiddenPhysicalLookup.has(physicalIndex)) {
              physicalColumnIndexes.push(physicalIndex);
            }
          });
        }

      // When all columns are hidden and the context menu is triggered using top-left corner.
      } else if (renderableStartColumn === null) {
        arrayEach(notTrimmedColumnIndexes.slice(0, this.countCols()), (physicalIndex) => {
          physicalColumnIndexes.push(physicalIndex);
        });

      } else if (visualStartColumn !== null) {
        collectAdjacentHiddenPhysicalIndexes(
          visualStartColumn,
          this.countCols(),
          notTrimmedColumnIndexes,
          hiddenPhysicalLookup,
          physicalColumnIndexes,
        );
      }

      arrayEach(physicalColumnIndexes, (physicalColumnIndex) => {
        columns.push(this.toVisualColumn(physicalColumnIndex));
      });

      return columns.length === 0;
    }
  };
}
