describe('settings', () => {

  describe('fragmentSelection', () => {
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
     * Returns current text selection or false if there is no text selection.
     *
     * @returns {string|boolean}
     */
    function getSelected() {
      // Please keep in mind that this method isn't deterministic. It have different result for different browsers.
      const selection = window.getSelection().toString();

      // Tabs and spaces between <td>s are inconsistent in browsers, so let's ignore them
      return selection.replace(/\s/g, ''); // Standardized returned values for different browsers.
    }

    /**
     * Selects a <fromEl> node at as many siblings as given in the <cells> value
     *
     * @param {HTMLElement} fromEl An element from the selection starts.
     * @param {number} siblings The number of siblings to process.
     */
    function selectElementText(fromEl, siblings) {
      let element = fromEl;
      let numOfSiblings = siblings;

      const sel = window.getSelection();
      const range = window.document.createRange();

      range.setStartBefore(element);

      while (numOfSiblings > 1) {
        element = element.nextSibling;
        numOfSiblings -= 1;
      }

      range.setEndAfter(element);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    describe('constructor', () => {
      it('should disallow fragmentSelection when set to false', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: false
        });

        selectElementText(spec().$container.find('tr:eq(0) td:eq(1)')[0], 3);

        selectElementText(spec().$container.find('td')[1], 3);
        $(spec().$container.find('tr:eq(0) td:eq(1)')).simulate('mousedown');
        $(spec().$container.find('tr:eq(0) td:eq(3)')).simulate('mouseover');
        $(spec().$container.find('tr:eq(0) td:eq(3)')).simulate('mouseup');
        $(spec().$container.find('tr:eq(0) td:eq(3)')).simulate('click');

        const sel = getSelected();

        expect(sel).toEqual(''); // copyPaste has selected space in textarea

        const copyEvent = getClipboardEvent();
        const plugin = hot.getPlugin('CopyPaste');

        plugin.onCopy(copyEvent);

        expect(copyEvent.clipboardData.getData('text/plain')).toBe('B1\tC1\tD1');
      });

      it('should allow fragmentSelection when set to true', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: true
        });

        selectElementText(spec().$container.find('td')[1], 3);
        $(spec().$container.find('tr:eq(0) td:eq(1)')).simulate('mousedown');
        $(spec().$container.find('tr:eq(0) td:eq(3)')).simulate('mouseover');
        $(spec().$container.find('tr:eq(0) td:eq(3)')).simulate('mouseup');
        $(spec().$container.find('tr:eq(0) td:eq(3)')).simulate('click');

        expect(getSelected()).toEqual('B1C1D1');

        const copyEvent = getClipboardEvent();
        const plugin = hot.getPlugin('CopyPaste');

        plugin.onCopy(copyEvent);

        expect(copyEvent.clipboardData.getData('text/plain')).toBe('B1\tC1\tD1');
      });

      it('should allow fragmentSelection from one cell when set to `cell`', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: 'cell'
        });

        const $TD = spec().$container.find('tr:eq(0) td:eq(1)');

        selectElementText($TD[0], 1);
        mouseDown($TD);
        mouseOver($TD);
        mouseMove($TD);
        mouseUp($TD);
        mouseClick($TD);

        expect(getSelected()).toEqual('B1');

        const copyEvent = getClipboardEvent();
        const plugin = hot.getPlugin('CopyPaste');

        plugin.onCopy(copyEvent);

        expect(copyEvent.clipboardData.getData('text/plain')).toBe('B1');
      });

      it('should disallow fragmentSelection from one cell when set to `cell` and when user selects adjacent cell', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: 'cell'
        });

        selectElementText(spec().$container.find('td')[1], 1);
        mouseDown(spec().$container.find('tr:eq(0) td:eq(1)'));
        mouseOver(spec().$container.find('tr:eq(0) td:eq(2)'));
        mouseMove(spec().$container.find('tr:eq(0) td:eq(2)'));
        mouseUp(spec().$container.find('tr:eq(0) td:eq(2)'));
        mouseClick(spec().$container.find('tr:eq(0) td:eq(2)'));

        expect(getSelected()).toEqual(''); // copyPaste has selected space in textarea

        const copyEvent = getClipboardEvent();
        const plugin = hot.getPlugin('CopyPaste');

        plugin.onCopy(copyEvent);

        expect(copyEvent.clipboardData.getData('text/plain')).toBe('B1\tC1');
      });

      it('should disallow fragmentSelection of Handsontable chrome (anything that is not table) when set to false', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: false
        });
        const $div = $('<div style="position: absolute; top: 0; left: 0">Text</div>');

        spec().$container.append($div);
        selectElementText($div[0], 1);

        $($div).simulate('mousedown');

        const sel = getSelected();

        expect(sel).toEqual('');
      });

      it('should disallow fragmentSelection of Handsontable chrome (anything that is not table) when set to true', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: true
        });
        const $div = $('<div style="position: absolute; top: 0; left: 0">Text</div>');

        spec().$container.append($div);
        selectElementText($div[0], 1);

        $($div).simulate('mousedown');

        const sel = getSelected();

        expect(sel).toEqual('');
      });
    });

    describe('dynamic', () => {
      it('should disallow fragmentSelection when set to false', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: true
        });

        updateSettings({ fragmentSelection: false });

        selectElementText(spec().$container.find('td')[1], 3);
        $(spec().$container.find('tr:eq(0) td:eq(1)')).simulate('mousedown');
        $(spec().$container.find('tr:eq(0) td:eq(3)')).simulate('mouseover');
        $(spec().$container.find('tr:eq(0) td:eq(3)')).simulate('mouseup');
        $(spec().$container.find('tr:eq(0) td:eq(3)')).simulate('click');

        const sel = getSelected();

        expect(sel).toEqual(''); // copyPaste has selected space in textarea

        const copyEvent = getClipboardEvent();
        const plugin = hot.getPlugin('CopyPaste');

        plugin.onCopy(copyEvent);

        expect(copyEvent.clipboardData.getData('text/plain')).toBe('B1\tC1\tD1');
      });

      it('should allow fragmentSelection when set to true', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          fragmentSelection: false
        });

        updateSettings({ fragmentSelection: true });

        selectElementText(spec().$container.find('td')[1], 3);
        $(spec().$container.find('tr:eq(0) td:eq(1)')).simulate('mousedown');
        $(spec().$container.find('tr:eq(0) td:eq(3)')).simulate('mouseover');
        $(spec().$container.find('tr:eq(0) td:eq(3)')).simulate('mouseup');
        $(spec().$container.find('tr:eq(0) td:eq(3)')).simulate('click');

        expect(getSelected()).toEqual('B1C1D1');

        const copyEvent = getClipboardEvent();
        const plugin = hot.getPlugin('CopyPaste');

        plugin.onCopy(copyEvent);

        expect(copyEvent.clipboardData.getData('text/plain')).toBe('B1\tC1\tD1');
      });
    });
  });
});
