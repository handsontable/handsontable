import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';

/**
 * @param {ManualColumnFreeze} manualColumnFreezePlugin The plugin instance.
 * @returns {object}
 */
export default function freezeColumnItem(manualColumnFreezePlugin: unknown) {
  return {
    key: 'freeze_column',
    name(this: HotInstance): string {
      const phrase: string = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_FREEZE_COLUMN);

      return phrase;
    },
    callback(this: HotInstance, key: unknown, selected: { start: { col: number } }[]) {
      const [{ start: { col: selectedColumn } }] = selected;

      (manualColumnFreezePlugin as { freezeColumn: Function }).freezeColumn(selectedColumn);

      this.view.adjustElementsSize();
      this.render();
    },
    hidden(this: HotInstance) {
      const selection = this.getSelectedRange();
      let hide = false;

      if (selection === undefined) {
        hide = true;

      } else if (selection.length > 1) {
        hide = true;

      } else if ((selection[0]!.from.col !== selection[0]!.to.col) ||
                 (selection[0]!.from.col! <= (this.getSettings().fixedColumnsStart ?? 0) - 1)) {
        hide = true;
      }

      return hide;
    },
  };
}
