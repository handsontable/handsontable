import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';
import { isPluginOff } from './isPluginOff';
import { followColumn } from './followColumn';
import { getStartBandCount, isInEndBand, isStartBandCut } from '../endBand';

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

      followColumn(this, selectedColumn, () => {
        (manualColumnFreezePlugin as { freezeColumn: Function }).freezeColumn(selectedColumn);
      });

      this.render();
    },
    // The menu rebuilds its items on every open, so a disabled plugin contributes none. The
    // command executor never evicts what it registered, though, so `executeCommand('freeze_column')`
    // still reaches this entry — and `execute()` gates on `disabled`, not `hidden`.
    disabled() {
      return isPluginOff(manualColumnFreezePlugin);
    },
    hidden(this: HotInstance) {
      const selection = this.getSelectedRange();
      let hide = false;

      if (isPluginOff(manualColumnFreezePlugin)) {
        hide = true;

      } else if (selection === undefined) {
        hide = true;

      } else if (selection.length > 1) {
        hide = true;

      } else if ((selection[0]!.from.col !== selection[0]!.to.col) ||
                 (selection[0]!.from.col! <= getStartBandCount(this) - 1)) {
        hide = true;

      } else if (isInEndBand(this, selection[0]!.from.col!)) {
        // A column of the `fixedColumnsEnd` band is already pinned, to the other edge.
        hide = true;

      } else if (isStartBandCut(this)) {
        // `limitFixedToViewport` drew fewer start columns than configured: one more would keep scrolling.
        hide = true;
      }

      return hide;
    },
  };
}
