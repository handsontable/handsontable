import * as C from './../../../i18n/constants';

export default function unfreezeColumnItem(manualColumnFreezePlugin) {
  return {
    key: 'unfreeze_column',
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN);
    },
    callback(key, selected) {
      const [{ start: { col: selectedColumn } }] = selected;

      manualColumnFreezePlugin.unfreezeColumn(selectedColumn);

      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);
    },
    hidden() {
      const selection = this.getSelectedRange();
      let hide = false;

      if (selection === void 0) {
        hide = true;

      } else if (selection.length > 1) {
        hide = true;

      } else if ((selection[0].from.col !== selection[0].to.col) || selection[0].from.col >= this.getSettings().fixedColumnsLeft) {
        hide = true;
      }

      return hide;
    },
  };
}
