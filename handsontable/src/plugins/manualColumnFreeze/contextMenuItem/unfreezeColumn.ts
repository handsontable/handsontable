import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';

/**
 * @param {ManualColumnFreeze} manualColumnFreezePlugin The plugin instance.
 * @returns {object}
 */
export default function unfreezeColumnItem(manualColumnFreezePlugin: unknown) {
  return {
    key: 'unfreeze_column',
    name(this: HotInstance): string {
      const phrase: string = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_UNFREEZE_COLUMN);

      return phrase;
    },
    callback(this: HotInstance, key: unknown, selected: { start: { col: number } }[]) {
      const [{ start: { col: selectedColumn } }] = selected;

      (manualColumnFreezePlugin as { unfreezeColumn: Function }).unfreezeColumn(selectedColumn);

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

      } else {
        const fromCol = selection[0].from.col;
        const toCol = selection[0].to.col;
        const fixedColumnsStart = this.getSettings().fixedColumnsStart ?? 0;

        if (fromCol !== toCol || (fromCol !== null && fromCol >= fixedColumnsStart)) {
          hide = true;
        }
      }

      return hide;
    },
  };
}
