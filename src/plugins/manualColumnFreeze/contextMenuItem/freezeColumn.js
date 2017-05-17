export default function freezeColumnItem(manualColumnFreezePlugin) {
  return {
    key: 'freeze_column',
    name: 'Freeze this column',
    callback() {
      let selectedColumn = this.getSelectedRange().from.col;

      manualColumnFreezePlugin.freezeColumn(selectedColumn);

      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);
    },
    hidden() {
      let selection = this.getSelectedRange();
      let hide = false;

      if (selection === void 0) {
        hide = true;

      } else if ((selection.from.col !== selection.to.col) || (selection.from.col <= this.getSettings().fixedColumnsLeft - 1)) {
        hide = true;
      }

      return hide;
    },
  };
}
