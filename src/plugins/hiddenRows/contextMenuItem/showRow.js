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
      const [startVisualRow,, endVisualRow] = this.getSelectedLast();
      const noVisibleIndexesBefore =
        this.rowIndexMapper.getFirstNotHiddenIndex(startVisualRow - 1, -1) === null;
      const onlyFirstVisibleRowSelected = noVisibleIndexesBefore && startVisualRow === endVisualRow;
      const noVisibleIndexesAfter =
        this.rowIndexMapper.getFirstNotHiddenIndex(endVisualRow + 1, 1) === null;
      const onlyLastVisibleRowSelected = noVisibleIndexesAfter && startVisualRow === endVisualRow;

      let startPhysicalRow = this.toPhysicalRow(startVisualRow);
      let endPhysicalRow = this.toPhysicalRow(endVisualRow);

      if (onlyFirstVisibleRowSelected) {
        startPhysicalRow = 0;
      }

      if (onlyLastVisibleRowSelected) {
        endPhysicalRow = this.countSourceRows() - 1; // All rows after the selected row will be shown.
      }

      hiddenRowsPlugin.showRows(rows);

      const startVisualRowAfterAction = this.toVisualRow(startPhysicalRow);
      const endVisualRowAfterAction = this.toVisualRow(endPhysicalRow);

      // Selection start and selection end coordinates might be changed after showing some items.
      this.selectRows(startVisualRowAfterAction, endVisualRowAfterAction);
      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);
    },
    disabled: false,
    hidden() {
      if (!this.selection.isSelectedByRowHeader() || hiddenRowsPlugin.getHiddenRows().length < 1) {
        return true;
      }

      rows.length = 0;

      const [startRow, , endRow] = this.getSelectedLast();
      const visualStartRow = Math.min(startRow, endRow);
      const visualEndRow = Math.max(startRow, endRow);
      const renderableStartRow = this.rowIndexMapper.getRenderableFromVisualIndex(visualStartRow);
      const renderableEndRow = this.rowIndexMapper.getRenderableFromVisualIndex(visualEndRow);

      if (visualStartRow === visualEndRow) {
        // Handled row is the first rendered index and there are some visual indexes before it.
        if (renderableStartRow === 0 && renderableStartRow < visualStartRow) {
          // not trimmed indexes -> array of mappings from visual (native array's index) to physical indexes (value).
          rows.push(...this.rowIndexMapper.getNotTrimmedIndexes().slice(0, visualStartRow)); // physical indexes

          return false;
        }

        const lastVisualIndex = this.countRows() - 1;
        const lastRenderableIndex = this.rowIndexMapper.getRenderableFromVisualIndex(
          this.rowIndexMapper.getFirstNotHiddenIndex(lastVisualIndex, -1)
        );

        // Handled row is the last rendered index and there are some visual indexes after it.
        if (renderableEndRow === lastRenderableIndex && lastVisualIndex > visualEndRow) {
          rows.push(...this.rowIndexMapper.getNotTrimmedIndexes().slice(visualEndRow + 1));
        }
      } else {
        const visualRowsInRange = visualEndRow - visualStartRow + 1;
        const renderedRowsInRange = renderableEndRow - renderableStartRow + 1;

        if (visualRowsInRange > renderedRowsInRange) {
          const hiddenRows = hiddenRowsPlugin.getHiddenRows();
          const physicalIndexesInRange = this.rowIndexMapper.getNotTrimmedIndexes().slice(visualStartRow, visualEndRow + 1);

          rows.push(...physicalIndexesInRange.filter(physicalIndex => hiddenRows.includes(physicalIndex)));
        }
      }

      return rows.length === 0;
    }
  };
}
