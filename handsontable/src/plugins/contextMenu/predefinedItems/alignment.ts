import {
  align,
  getAlignmentClasses,
} from '../utils';
import { KEY as SEPARATOR } from './separator';
import * as C from '../../../i18n/constants';
import type { HotInstance } from '../../../core/types';

export const KEY = 'alignment';

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
            const selectedRange = this.getSelectedRange() ?? [];
            const stateBefore = getAlignmentClasses(selectedRange,
              (row: number, col: number) => this.getCellMeta(row, col).className as string);
            const type = 'horizontal';
            const alignment = 'htLeft';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row: number, col: number) => this.getCellMeta(row, col),
              (row: number, col: number, key: string, value: string) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:center`,
          name(this: HotInstance): string {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER);
          },
          callback(this: HotInstance) {
            const selectedRange = this.getSelectedRange() ?? [];
            const stateBefore = getAlignmentClasses(selectedRange,
              (row: number, col: number) => this.getCellMeta(row, col).className as string);
            const type = 'horizontal';
            const alignment = 'htCenter';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row: number, col: number) => this.getCellMeta(row, col),
              (row: number, col: number, key: string, value: string) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:right`,
          name(this: HotInstance): string {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT);
          },
          callback(this: HotInstance) {
            const selectedRange = this.getSelectedRange() ?? [];
            const stateBefore = getAlignmentClasses(selectedRange,
              (row: number, col: number) => this.getCellMeta(row, col).className as string);
            const type = 'horizontal';
            const alignment = 'htRight';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row: number, col: number) => this.getCellMeta(row, col),
              (row: number, col: number, key: string, value: string) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:justify`,
          name(this: HotInstance): string {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY);
          },
          callback(this: HotInstance) {
            const selectedRange = this.getSelectedRange() ?? [];
            const stateBefore = getAlignmentClasses(selectedRange,
              (row: number, col: number) => this.getCellMeta(row, col).className as string);
            const type = 'horizontal';
            const alignment = 'htJustify';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row: number, col: number) => this.getCellMeta(row, col),
              (row: number, col: number, key: string, value: string) => this.setCellMeta(row, col, key, value));
            this.render();
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
            const selectedRange = this.getSelectedRange() ?? [];
            const stateBefore = getAlignmentClasses(selectedRange,
              (row: number, col: number) => this.getCellMeta(row, col).className as string);
            const type = 'vertical';
            const alignment = 'htTop';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row: number, col: number) => this.getCellMeta(row, col),
              (row: number, col: number, key: string, value: string) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:middle`,
          name(this: HotInstance): string {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE);
          },
          callback(this: HotInstance) {
            const selectedRange = this.getSelectedRange() ?? [];
            const stateBefore = getAlignmentClasses(selectedRange,
              (row: number, col: number) => this.getCellMeta(row, col).className as string);
            const type = 'vertical';
            const alignment = 'htMiddle';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row: number, col: number) => this.getCellMeta(row, col),
              (row: number, col: number, key: string, value: string) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        },
        {
          key: `${KEY}:bottom`,
          name(this: HotInstance): string {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM);
          },
          callback(this: HotInstance) {
            const selectedRange = this.getSelectedRange() ?? [];
            const stateBefore = getAlignmentClasses(selectedRange,
              (row: number, col: number) => this.getCellMeta(row, col).className as string);
            const type = 'vertical';
            const alignment = 'htBottom';

            this.runHooks('beforeCellAlignment', stateBefore, selectedRange, type, alignment);
            align(selectedRange, type, alignment, (row: number, col: number) => this.getCellMeta(row, col),
              (row: number, col: number, key: string, value: string) => this.setCellMeta(row, col, key, value));
            this.render();
          },
          disabled: false
        }
      ]
    }
  };
}
