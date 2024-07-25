import {
  align,
  getAlignmentClasses,
  getAlignmentComparatorByClass,
  checkSelectionConsistency,
  markLabelAsSelected
} from '../utils';
import { KEY as SEPARATOR } from './separator';
import * as C from '../../../i18n/constants';

export const KEY = 'alignment';

/**
 * @param {object} hot The current Handsontable instance.
 * @param {string} htClassName The class name to check.
 * @returns {string} The value of aria-checked parameter.
 */
function ariaChecked(hot, htClassName) {
  const hasClass = checkSelectionConsistency(
    hot.getSelectedRange(),
    getAlignmentComparatorByClass(htClassName).bind(hot));

  return hasClass.toString();
}

/**
 * @param {object} hot The current Handsontable instance.
 * @param {string} rawName The raw name of the menu item.
 * @param {string} htClassName The class name to check.
 * @returns {string} The value of aria-label parameter.
 */
function ariaLabel(hot, rawName, htClassName) {
  const hasClass = checkSelectionConsistency(
    hot.getSelectedRange(),
    getAlignmentComparatorByClass(htClassName).bind(hot));

  const checkboxState = hasClass
    ? hot.getTranslatedPhrase(C.CHECKBOX_CHECKED)
    : hot.getTranslatedPhrase(C.CHECKBOX_UNCHECKED);

  return `${rawName} ${checkboxState.toLowerCase()}`;
}

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
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT), 'htLeft');
          },
          ariaChecked() {
            return ariaChecked(this, 'htLeft');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_LEFT);
            const hasClass = checkSelectionConsistency(
              this.getSelectedRange(),
              getAlignmentComparatorByClass('htLeft').bind(this)
            );

            if (hasClass) {
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
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER), 'htCenter');
          },
          ariaChecked() {
            return ariaChecked(this, 'htCenter');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_CENTER);
            const hasClass = checkSelectionConsistency(
              this.getSelectedRange(),
              getAlignmentComparatorByClass('htCenter').bind(this)
            );

            if (hasClass) {
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
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT), 'htRight');
          },
          ariaChecked() {
            return ariaChecked(this, 'htRight');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_RIGHT);
            const hasClass = checkSelectionConsistency(
              this.getSelectedRange(),
              getAlignmentComparatorByClass('htRight').bind(this)
            );

            if (hasClass) {
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
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY), 'htJustify');
          },
          ariaChecked() {
            return ariaChecked(this, 'htJustify');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_JUSTIFY);
            const hasClass = checkSelectionConsistency(
              this.getSelectedRange(),
              getAlignmentComparatorByClass('htJustify').bind(this)
            );

            if (hasClass) {
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
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP), 'htTop');
          },
          ariaChecked() {
            return ariaChecked(this, 'htTop');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_TOP);
            const hasClass = checkSelectionConsistency(
              this.getSelectedRange(),
              getAlignmentComparatorByClass('htTop').bind(this)
            );

            if (hasClass) {
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
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE), 'htMiddle');
          },
          ariaChecked() {
            return ariaChecked(this, 'htMiddle');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_MIDDLE);
            const hasClass = checkSelectionConsistency(
              this.getSelectedRange(),
              getAlignmentComparatorByClass('htMiddle').bind(this)
            );

            if (hasClass) {
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
            return ariaLabel(this, this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM), 'htBottom');
          },
          ariaChecked() {
            return ariaChecked(this, 'htBottom');
          },
          name() {
            let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ALIGNMENT_BOTTOM);
            const hasClass = checkSelectionConsistency(
              this.getSelectedRange(),
              getAlignmentComparatorByClass('htBottom').bind(this)
            );

            if (hasClass) {
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
