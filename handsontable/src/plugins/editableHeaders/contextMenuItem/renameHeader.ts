import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';
import type { HeaderAxis } from '../types';

/**
 * What the item needs from the plugin.
 */
interface RenameHeaderPlugin {
  enabled: boolean;
  isEditable(axis: HeaderAxis, visualIndex: number): boolean;
  openEditor(axis: HeaderAxis, visualIndex: number): boolean;
}

/**
 * Resolves the header the menu was opened for: a whole column or row selected from its header, or a header
 * focused with the keyboard.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {{ axis: HeaderAxis, visualIndex: number }|null}
 */
export function getMenuTarget(hot: HotInstance): { axis: HeaderAxis; visualIndex: number } | null {
  const ranges = hot.getSelectedRange();

  if (ranges === undefined || ranges.length !== 1) {
    return null;
  }

  const [range] = ranges;
  const { from, to, highlight } = range!;

  if (range!.isSingleHeader()) {
    if (highlight.row !== null && highlight.row < 0 && highlight.col !== null && highlight.col >= 0) {
      return { axis: 'column', visualIndex: highlight.col };
    }

    if (highlight.col === -1 && highlight.row !== null && highlight.row >= 0) {
      return { axis: 'row', visualIndex: highlight.row };
    }

    return null;
  }

  if (hot.selection.isSelectedByColumnHeader() && from.col === to.col && from.col !== null && from.col >= 0) {
    return { axis: 'column', visualIndex: from.col };
  }

  if (hot.selection.isSelectedByRowHeader() && from.row === to.row && from.row !== null && from.row >= 0) {
    return { axis: 'row', visualIndex: from.row };
  }

  return null;
}

/**
 * The "Rename header" menu item. It opens the input over the header of the selected column or row.
 *
 * @param {EditableHeaders} plugin The plugin instance.
 * @returns {object}
 */
export default function renameHeaderItem(plugin: RenameHeaderPlugin) {
  return {
    key: 'rename_header',
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_RENAME_HEADER) as string;
    },
    callback(this: HotInstance) {
      const target = getMenuTarget(this);

      if (target !== null) {
        plugin.openEditor(target.axis, target.visualIndex);
      }
    },
    // The command executor keeps the entry after the plugin is off, so `executeCommand('rename_header')` must find
    // it disabled then.
    disabled(this: HotInstance) {
      const target = getMenuTarget(this);

      return !plugin.enabled || target === null || !plugin.isEditable(target.axis, target.visualIndex);
    },
    hidden(this: HotInstance) {
      const target = getMenuTarget(this);

      return !plugin.enabled || target === null || !plugin.isEditable(target.axis, target.visualIndex);
    },
  };
}
