import { rangeEach } from '../../../helpers/number';
import * as C from '../../../i18n/constants';

export default function showColumnItem(hiddenColumnsPlugin) {
  const hiddenBefore = [];
  const hiddenBetween = [];
  const hiddenAfter = [];

  return {
    key: 'hidden_columns_show',
    name() {
      const hiddenColumnsLength = hiddenBefore.length + hiddenBetween.length + hiddenAfter.length;
      const pluralForm = hiddenColumnsLength <= 1 ? 0 : 1;

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_SHOW_COLUMN, pluralForm);
    },
    callback() {
      if (hiddenBetween.length) {
        hiddenColumnsPlugin.showColumns(hiddenBetween);

      } else {
        if (hiddenBefore.length) {
          hiddenColumnsPlugin.showColumns(hiddenBefore);
        }
        if (hiddenAfter.length) {
          hiddenColumnsPlugin.showColumns(hiddenAfter);
        }
      }

      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);
    },
    disabled: false,
    hidden() {
      if (!this.selection.isSelectedByColumnHeader() || !hiddenColumnsPlugin.areColumnsVisible('all')) {
        return true;
      }

      hiddenBefore.length = 0;
      hiddenBetween.length = 0;
      hiddenAfter.length = 0;

      let shouldBeHidden = true;
      let [, start, , end] = this.getSelectedLast();
      [start, end] = [Math.min(start, end), Math.max(start, end)];

      if (start === end) {
        rangeEach(0, start - 1, (column) => {
          if (hiddenColumnsPlugin.isHidden(column)) {
            hiddenBefore.push(column);

          } else {
            hiddenBefore.length = 0;

            return false;
          }
        });
        rangeEach(end, this.countCols(), (column) => {
          if (hiddenColumnsPlugin.isHidden(column)) {
            hiddenAfter.push(column);

          } else {
            hiddenAfter.length = 0;

            return false;
          }
        });

        shouldBeHidden = hiddenBefore.length + hiddenAfter.length === 0;

      } else {
        rangeEach(start, end, (column) => {
          if (hiddenColumnsPlugin.isHidden(column)) {
            hiddenBetween.push(column);
          }
        });

        shouldBeHidden = hiddenBetween.length === 0;
      }

      return shouldBeHidden;
    }
  };
}
