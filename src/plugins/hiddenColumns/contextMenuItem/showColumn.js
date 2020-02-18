import { rangeEach } from '../../../helpers/number';
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
      const onlyFirstVisibleColumnSelected =
        this.columnIndexMapper.getRenderableFromVisualIndex(startVisualColumn) === 0 &&
        startVisualColumn === endVisualColumn;
      const onlyLastVisibleColumnSelected =
        this.columnIndexMapper.getRenderableFromVisualIndex(endVisualColumn) === this.countRenderableColumns() - 1 &&
        startVisualColumn === endVisualColumn;

      let startPhysicalColumn = this.toPhysicalColumn(startVisualColumn);
      let endPhysicalColumn = this.toPhysicalColumn(endVisualColumn);

      if (onlyFirstVisibleColumnSelected) {
        startPhysicalColumn = 0;
      }

      if (onlyLastVisibleColumnSelected) {
        endPhysicalColumn = this.countSourceCols() - 1;
      }

      hiddenColumnsPlugin.showColumns(columns);

      const startVisualColumnAfterAction = this.toVisualColumn(startPhysicalColumn);
      const endVisualColumnAfterAction = this.toVisualColumn(endPhysicalColumn);

      // Selection start and selection end coordinates might be changed after showing some items.
      this.selectColumns(startVisualColumnAfterAction, endVisualColumnAfterAction);
      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);
    },
    disabled: false,
    hidden() {
      if (!this.selection.isSelectedByColumnHeader() || hiddenColumnsPlugin.getHiddenColumns().length < 1) {
        return true;
      }

      columns.length = 0;

      const [, startColumn, , endColumn] = this.getSelectedLast();
      const start = Math.min(startColumn, endColumn);
      const end = Math.max(startColumn, endColumn);
      const sequence = this.columnIndexMapper.getIndexesSequence();
      const physicalStartColumn = this.columnIndexMapper.getPhysicalFromVisualIndex(start);
      const currentStartPosition = sequence.indexOf(physicalStartColumn);

      if (start === end) {
        const columnsBefore = [];
        const columnsAfter = [];

        rangeEach(0, currentStartPosition - 1, (column) => {
          if (hiddenColumnsPlugin.isHidden(sequence[column], true)) {
            columnsBefore.push(sequence[column]);

          } else {
            columnsBefore.length = 0;

            return false;
          }
        });

        rangeEach(currentStartPosition + 1, this.countCols() - 1, (column) => {
          if (hiddenColumnsPlugin.isHidden(sequence[column], true)) {
            columnsAfter.push(sequence[column]);

          } else {
            columnsAfter.length = 0;

            return false;
          }
        });

        columns.push(...columnsBefore, ...columnsAfter);

      } else {
        const physicalEndColumn = this.columnIndexMapper.getPhysicalFromVisualIndex(end);
        const currentEndPosition = sequence.indexOf(physicalEndColumn);

        rangeEach(currentStartPosition, currentEndPosition, (column) => {
          if (hiddenColumnsPlugin.isHidden(sequence[column], true)) {
            columns.push(sequence[column]);
          }
        });
      }

      return columns.length < 1;
    }
  };
}
