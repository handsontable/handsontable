import {
  align,
  getAlignmentClasses,
} from '../utils';
import { KEY as SEPARATOR } from './separator';
import * as C from '../../../i18n/constants';
import { deepClone } from '../../../helpers/object';
import type { HotInstance } from '../../../core/types';

export const KEY = 'alignment';

/**
 * Aligns the selected cells, as one user action (one undo step).
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {string} type `horizontal` or `vertical`.
 * @param {string} alignment The alignment class name.
 */
function applyAlignment(hot: HotInstance, type: string, alignment: string) {
  hot.runOperation('cell_alignment', () => {
    const selectedRange = hot.getSelectedRange() ?? [];
    const stateBefore = getAlignmentClasses(selectedRange,
      (row: number, col: number) => hot.getCellMetaTransient(row, col).className as string);

    // The undo step holds plain copies: the ranges are the selection's own and change with it.
    hot._getOperationScope().describe({ stateBefore, range: deepClone(selectedRange), type, alignment });
    hot.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
    align(selectedRange, type, alignment, (row: number, col: number) => hot.getCellMetaTransient(row, col),
      (row: number, col: number, key: string, value: string) => hot.setCellMeta(row, col, key, value));
    hot.render();
  }, 'ContextMenu.alignment');
}

/**
 * @returns {object}
 */
export default function alignmentItem() {
  return {
    key: KEY,
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT);
    },
    disabled(this: HotInstance) {
      if (this.countRows() === 0 || this.countCols() === 0) {
        return true;
      }

      const range = this.getSelectedRangeActive();

      if (!range) {
        return true;
      }

      if (range.isSingleHeader()) {
        return true;
      }

      return !(this.getSelectedRange() && !this.selection.isSelectedByCorner());
    },
    submenu: {
      items: [
        {
          key: `${KEY}:left`,
          name(this: HotInstance): string {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT);
          },
          callback(this: HotInstance) {
            applyAlignment(this, 'horizontal', 'htLeft');
          },
          disabled: false
        },
        {
          key: `${KEY}:center`,
          name(this: HotInstance): string {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER);
          },
          callback(this: HotInstance) {
            applyAlignment(this, 'horizontal', 'htCenter');
          },
          disabled: false
        },
        {
          key: `${KEY}:right`,
          name(this: HotInstance): string {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT);
          },
          callback(this: HotInstance) {
            applyAlignment(this, 'horizontal', 'htRight');
          },
          disabled: false
        },
        {
          key: `${KEY}:justify`,
          name(this: HotInstance): string {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY);
          },
          callback(this: HotInstance) {
            applyAlignment(this, 'horizontal', 'htJustify');
          },
          disabled: false
        },
        {
          name: SEPARATOR
        },
        {
          key: `${KEY}:top`,
          name(this: HotInstance): string {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP);
          },
          callback(this: HotInstance) {
            applyAlignment(this, 'vertical', 'htTop');
          },
          disabled: false
        },
        {
          key: `${KEY}:middle`,
          name(this: HotInstance): string {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE);
          },
          callback(this: HotInstance) {
            applyAlignment(this, 'vertical', 'htMiddle');
          },
          disabled: false
        },
        {
          key: `${KEY}:bottom`,
          name(this: HotInstance): string {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM);
          },
          callback(this: HotInstance) {
            applyAlignment(this, 'vertical', 'htBottom');
          },
          disabled: false
        }
      ]
    }
  };
}
