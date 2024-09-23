import {
  align,
  getAlignmentClasses,
  markLabelAsSelected,
  hasSelectionAClass
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
          checkable: true,
          ariaLabel() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT);
          },
          ariaChecked() {
            return hasSelectionAClass(this, 'htLeft');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT);

            if (hasSelectionAClass(this, 'htLeft')) {
              label = markLabelAsSelected(label);
            }

            return label;
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
          checkable: true,
          ariaLabel() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER);
          },
          ariaChecked() {
            return hasSelectionAClass(this, 'htCenter');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER);

            if (hasSelectionAClass(this, 'htCenter')) {
              label = markLabelAsSelected(label);
            }

            return label;
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
          checkable: true,
          ariaLabel() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT);
          },
          ariaChecked() {
            return hasSelectionAClass(this, 'htRight');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT);

            if (hasSelectionAClass(this, 'htRight')) {
              label = markLabelAsSelected(label);
            }

            return label;
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
          checkable: true,
          ariaLabel() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY);
          },
          ariaChecked() {
            return hasSelectionAClass(this, 'htJustify');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY);

            if (hasSelectionAClass(this, 'htJustify')) {
              label = markLabelAsSelected(label);
            }

            return label;
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
          checkable: true,
          ariaLabel() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP);
          },
          ariaChecked() {
            return hasSelectionAClass(this, 'htTop');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP);

            if (hasSelectionAClass(this, 'htTop')) {
              label = markLabelAsSelected(label);
            }

            return label;
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
          checkable: true,
          ariaLabel() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE);
          },
          ariaChecked() {
            return hasSelectionAClass(this, 'htMiddle');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE);

            if (hasSelectionAClass(this, 'htMiddle')) {
              label = markLabelAsSelected(label);
            }

            return label;
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
          checkable: true,
          ariaLabel() {
            return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM);
          },
          ariaChecked() {
            return hasSelectionAClass(this, 'htBottom');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM);

            if (hasSelectionAClass(this, 'htBottom')) {
              label = markLabelAsSelected(label);
            }

            return label;
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
