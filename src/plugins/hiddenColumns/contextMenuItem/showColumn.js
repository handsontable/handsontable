import { arrayEach, arrayMap } from '../../../helpers/array';
import * as C from '../../../i18n/constants';

/**
 * @param {HiddenColumns} hiddenColumnsPlugin The plugin instance.
 * @returns {object}
 */
export default function showColumnItem(hiddenColumnsPlugin) {
  const columns = [];

  return {
    key: 'hidden_columns_show',
    name() {
      const pluralForm = columns.length > 1 ? 1 : 0;

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_SHOW_COLUMN, pluralForm);
    },
    callback() {
      const [, startVisualColumn, , endVisualColumn] = this.getSelectedLast();
      const noVisibleIndexesBefore =
        this.columnIndexMapper.getFirstNotHiddenIndex(startVisualColumn - 1, -1) === null;
      const onlyFirstVisibleColumnSelected = noVisibleIndexesBefore && startVisualColumn === endVisualColumn;
      const noVisibleIndexesAfter =
        this.columnIndexMapper.getFirstNotHiddenIndex(endVisualColumn + 1, 1) === null;
      const onlyLastVisibleColumnSelected = noVisibleIndexesAfter && startVisualColumn === endVisualColumn;

      let startPhysicalColumn = this.toPhysicalColumn(startVisualColumn);
      let endPhysicalColumn = this.toPhysicalColumn(endVisualColumn);

      if (onlyFirstVisibleColumnSelected) {
        startPhysicalColumn = 0;
      }

      if (onlyLastVisibleColumnSelected) {
        endPhysicalColumn = this.countSourceCols() - 1; // All columns after the selected column will be shown.
      }

      hiddenColumnsPlugin.showColumns(columns);

      const startVisualColumnAfterAction = this.toVisualColumn(startPhysicalColumn);
      const endVisualColumnAfterAction = this.toVisualColumn(endPhysicalColumn);

      const allColumnsSelected = endVisualColumnAfterAction - startVisualColumnAfterAction + 1 === this.countCols();
      // TODO: Workaround, because selection doesn't select headers properly in a case when we select all columns
      // from `0` to `n`, where `n` is number of columns in the `DataMap`.
      const selectionStart = allColumnsSelected ? -1 : startVisualColumnAfterAction;

      // We render columns at first. It was needed for getting fixed columns.
      // Please take a look at #6864 for broader description.
      this.render();
      this.view.wt.wtOverlays.adjustElementsSizes(true);

      // Selection start and selection end coordinates might be changed after showing some items.
      this.selectColumns(selectionStart, endVisualColumnAfterAction);
    },
    disabled: false,
    hidden() {
      const hiddenPhysicalColumns = arrayMap(hiddenColumnsPlugin.getHiddenColumns(), (visualColumnIndex) => {
        return this.toPhysicalColumn(visualColumnIndex);
      });

      if (!this.selection.isSelectedByColumnHeader() || hiddenPhysicalColumns.length < 1) {
        return true;
      }

      columns.length = 0;

      const [, startColumn, , endColumn] = this.getSelectedLast();
      const visualStartColumn = Math.min(startColumn, endColumn);
      const visualEndColumn = Math.max(startColumn, endColumn);
      const columnIndexMapper = this.columnIndexMapper;
      const renderableStartColumn = columnIndexMapper.getRenderableFromVisualIndex(visualStartColumn);
      const renderableEndColumn = columnIndexMapper.getRenderableFromVisualIndex(visualEndColumn);
      const notTrimmedColumnIndexes = columnIndexMapper.getNotTrimmedIndexes();
      const physicalColumnIndexes = [];

      if (visualStartColumn !== visualEndColumn) {
        const visualColumnsInRange = visualEndColumn - visualStartColumn + 1;
        const renderedColumnsInRange = renderableEndColumn - renderableStartColumn + 1;

        // Collect not trimmed columns if there are some hidden columns in the selection range.
        if (visualColumnsInRange > renderedColumnsInRange) {
          const physicalIndexesInRange = notTrimmedColumnIndexes.slice(visualStartColumn, visualEndColumn + 1);

          physicalColumnIndexes.push(...physicalIndexesInRange.filter(physicalIndex => hiddenPhysicalColumns.includes(physicalIndex)));
        }

      // Handled column is the first rendered index and there are some visual indexes before it.
      } else if (renderableStartColumn === 0 && renderableStartColumn < visualStartColumn) {
        // not trimmed indexes -> array of mappings from visual (native array's index) to physical indexes (value).
        physicalColumnIndexes.push(...notTrimmedColumnIndexes.slice(0, visualStartColumn)); // physical indexes

      // When all columns are hidden and the context menu is triggered using top-left corner.
      } else if (renderableStartColumn === null) {
        // Show all hidden columns.
        physicalColumnIndexes.push(...notTrimmedColumnIndexes.slice(0, this.countCols()));

      } else {
        const lastVisualIndex = this.countCols() - 1;
        const lastRenderableIndex = columnIndexMapper.getRenderableFromVisualIndex(
          columnIndexMapper.getFirstNotHiddenIndex(lastVisualIndex, -1)
        );

        // Handled column is the last rendered index and there are some visual indexes after it.
        if (renderableEndColumn === lastRenderableIndex && lastVisualIndex > visualEndColumn) {
          physicalColumnIndexes.push(...notTrimmedColumnIndexes.slice(visualEndColumn + 1));
        }
      }

      arrayEach(physicalColumnIndexes, (physicalColumnIndex) => {
        columns.push(this.toVisualColumn(physicalColumnIndex));
      });

      return columns.length === 0;
    }
  };
}
