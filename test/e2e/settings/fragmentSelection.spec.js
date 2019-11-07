describe('settings', () => {

  xdescribe('fragmentSelection', () => {
    const id = 'testContainer';

    beforeEach(function() {
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    /**
     * Returns current text selection or false if there is no text selection
     * @returns {*}
     */
    function getSelected() {
      const { activeElement } = document;
      const selection = window.getSelection();

      if (selection.type === 'Range') {
        return selection.toString();
      } else if (activeElement.value && activeElement.value.selectionStart) {
        return activeElement.value.substring(activeElement.selectionStart, activeElement.selectionEnd);
      }

      return false;
    }

    /**
     * Selects a <fromEl> node at as many siblings as given in the <cells> value
     * Note: IE8 fallback assumes that a node contains exactly one word
     * @param fromEl
     * @param siblings
     */
    function selectElementText(fromEl, siblings) {
      const doc = window.document;
      let element = fromEl;
      let numOfSiblings = siblings;
      let sel;
      let range;

      if (window.getSelection && doc.createRange) { // standards
        sel = window.getSelection();
        range = doc.createRange();
        range.setStartBefore(element, 0);
        while (numOfSiblings > 1) {
          element = element.nextSibling;
          numOfSiblings -= 1;
        }
        range.setEndAfter(element, 0);
        sel.removeAllRanges();
        sel.addRange(range);

      } else if (doc.body.createTextRange) { // IE8
        range = doc.body.createTextRange();
        range.moveToElementText(element);
        range.moveEnd('word', numOfSiblings + 1);
        range.select();
      }
    }

    describe('constructor', () => {
      it('should disallow fragmentSelection when set to false', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: false
        });

        selectElementText(spec().$container.find('tr:eq(0) td:eq(1)')[0], 3);

        mouseDown(spec().$container.find('tr:eq(0) td:eq(3)'));
        mouseUp(spec().$container.find('tr:eq(0) td:eq(3)'));

        const sel = getSelected();

        expect(sel).toEqual(' '); // copyPaste has selected space in textarea
      });

      it('should allow fragmentSelection when set to true', () => {
        // We have to try another way to simulate text selection.
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: true
        });

        mouseDown(spec().$container.find('tr:eq(0) td:eq(1)'));
        mouseUp(spec().$container.find('tr:eq(0) td:eq(3)'));
        selectElementText(spec().$container.find('td')[1], 3);

        let sel = getSelected();
        sel = sel.replace(/\s/g, ''); // tabs and spaces between <td>s are inconsistent in browsers, so let's ignore them

        expect(sel).toEqual('B1C1D1');
      });

      it('should allow fragmentSelection from one cell when set to `cell`', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: 'cell'
        });

        const $TD = spec().$container.find('tr:eq(0) td:eq(1)');

        mouseDown($TD);
        mouseUp($TD);
        selectElementText($TD[0], 1);

        expect(getSelected().replace(/\s/g, '')).toEqual('B1');
      });

      it('should disallow fragmentSelection from one cell when set to `cell` and when user selects adjacent cell', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: 'cell'
        });
        selectElementText(spec().$container.find('td')[1], 1);

        mouseDown(spec().$container.find('tr:eq(0) td:eq(1)'));
        mouseOver(spec().$container.find('tr:eq(0) td:eq(2)'));
        mouseMove(spec().$container.find('tr:eq(0) td:eq(2)'));
        mouseUp(spec().$container.find('tr:eq(0) td:eq(2)'));

        expect(getSelected()).toEqual(' '); // copyPaste has selected space in textarea
      });

      it('should disallow fragmentSelection of Handsontable chrome (anything that is not table) when set to false', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: false
        });
        const $div = $('<div style="position: absolute; top: 0; left: 0">Text</div>');
        spec().$container.append($div);
        selectElementText($div[0], 1);

        mouseDown($div);

        const sel = getSelected();
        expect(sel).toEqual(false);
      });

      it('should disallow fragmentSelection of Handsontable chrome (anything that is not table) when set to true', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: true
        });
        const $div = $('<div style="position: absolute; top: 0; left: 0">Text</div>');
        spec().$container.append($div);
        selectElementText($div[0], 1);

        mouseDown($div);

        const sel = getSelected();
        expect(sel).toEqual(false);
      });
    });

    describe('dynamic', () => {
      it('should disallow fragmentSelection when set to false', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: true
        });
        // updateSettings({ fragmentSelection: false });
        selectElementText(spec().$container.find('tr:eq(0) td:eq(1)')[0], 3);

        mouseDown(spec().$container.find('tr:eq(0) td:eq(3)'));
        mouseUp(spec().$container.find('tr:eq(0) td:eq(3)'));

        const sel = getSelected();
        expect(sel).toEqual(' '); // copyPaste has selected space in textarea
      });

      xit('should allow fragmentSelection when set to true', () => {
        // We have to try another way to simulate text selection.
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: false
        });
        updateSettings({ fragmentSelection: true });
        selectElementText(spec().$container.find('td')[1], 3);

        mouseDown(spec().$container.find('tr:eq(0) td:eq(3)'));
        mouseUp(spec().$container.find('tr:eq(0) td:eq(3)'));

        let sel = getSelected();
        sel = sel.replace(/\s/g, ''); // tabs and spaces between <td>s are inconsistent in browsers, so let's ignore them
        expect(sel).toEqual('B1C1D1');
      });
    });
  }).pend('Temporarily disabled, due to #6083, needs to be rewritten to work properly.');
});
