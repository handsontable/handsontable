import {
  align,
  getAlignmentClasses,
} from '../utils';
import { KEY as SEPARATOR } from './separator';
import * as C from '../../../i18n/constants';

export const KEY = 'alignment';

/**
 * @returns {object}
 */
export default function alignmentItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT);
    },
    disabled() {
      if (this.countRows() === 0 || this.countCols() === 0) {
        return true;
      }

      const range = this.getSelectedRangeLast();

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
          name() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT);
          },
          callback() {
            const selectedRange = this.getSelectedRange();
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'horizontal';
            const alignment = 'htLeft';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:center`,
          name() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER);
          },
          callback() {
            const selectedRange = this.getSelectedRange();
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'horizontal';
            const alignment = 'htCenter';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:right`,
          name() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT);
          },
          callback() {
            const selectedRange = this.getSelectedRange();
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'horizontal';
            const alignment = 'htRight';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:justify`,
          name() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY);
          },
          callback() {
            const selectedRange = this.getSelectedRange();
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'horizontal';
            const alignment = 'htJustify';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          name: SEPARATOR
        },
        {
          key: `${KEY}:top`,
          name() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP);
          },
          callback() {
            const selectedRange = this.getSelectedRange();
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'vertical';
            const alignment = 'htTop';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:middle`,
          name() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE);
          },
          callback() {
            const selectedRange = this.getSelectedRange();
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'vertical';
            const alignment = 'htMiddle';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:bottom`,
          name() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM);
          },
          callback() {
            const selectedRange = this.getSelectedRange();
            const stateBefore = getAlignmentClasses(selectedRange, (row, col) => this.getCellMeta(row, col).className);
            const type = 'vertical';
            const alignment = 'htBottom';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row, col) => this.getCellMeta(row, col),
              (row, col, key, value) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        }
      ]
    }
  };
}
