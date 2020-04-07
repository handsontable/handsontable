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
      const visualStartColumn = Math.min(startColumn, endColumn);
      const visualEndColumn = Math.max(startColumn, endColumn);
      const renderableStartColumn = this.columnIndexMapper.getRenderableFromVisualIndex(visualStartColumn);
      const renderableEndColumn = this.columnIndexMapper.getRenderableFromVisualIndex(visualEndColumn);

      if (visualStartColumn === visualEndColumn) {
        // Handled column is the first rendered index and there are some visual indexes before it.
        if (renderableStartColumn === 0 && renderableStartColumn < visualStartColumn) {
          // not trimmed indexes -> array of mappings from visual (native array's index) to physical indexes (value).
          columns.push(...this.columnIndexMapper.getNotTrimmedIndexes().slice(0, visualStartColumn)); // physical indexes

          return false;
        }

        const lastVisualIndex = this.countCols() - 1;
        const lastRenderableIndex = this.countRenderableColumns() - 1;

        // Handled column is the last rendered index and there are some visual indexes after it.
        if (renderableEndColumn === lastRenderableIndex && lastVisualIndex > visualEndColumn) {
          columns.push(...this.columnIndexMapper.getNotTrimmedIndexes().slice(visualEndColumn + 1));
        }
      } else {
        const visualColumnsInRange = visualEndColumn - visualStartColumn + 1;
        const renderedColumnsInRange = renderableEndColumn - renderableStartColumn + 1;

        if (visualColumnsInRange > renderedColumnsInRange) {
          const hiddenColumns = hiddenColumnsPlugin.getHiddenColumns();
          const physicalIndexesInRange = this.columnIndexMapper.getNotTrimmedIndexes().slice(visualStartColumn + 1, visualEndColumn);

          columns.push(...physicalIndexesInRange.filter(physicalIndex => hiddenColumns.includes(physicalIndex)));
        }
      }

      return columns.length === 0;
    }
  };
}
