import * as C from '../../../i18n/constants';

/**
 * @param {ManualColumnFreeze} manualColumnFreezePlugin The plugin instance.
 * @returns {object}
 */
export default function freezeColumnItem(manualColumnFreezePlugin) {
  return {
    key: 'freeze_column',
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_FREEZE_COLUMN);
    },
    callback(key, selected) {
      const [{ start: { col: selectedColumn } }] = selected;

      manualColumnFreezePlugin.freezeColumn(selectedColumn);

      this.render();
      this.view.adjustElementsSize();
    },
    hidden() {
      const selection = this.getSelectedRange();
      let hide = false;

      if (selection === undefined) {
        hide = true;

      } else if (selection.length > 1) {
        hide = true;

      } else if ((selection[0].from.col !== selection[0].to.col) ||
                 (selection[0].from.col <= this.getSettings().fixedColumnsStart - 1)) {
        hide = true;
      }

      return hide;
    },
  };
}
