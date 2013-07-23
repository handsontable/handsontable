describe('settings', function () {
  describe('fragmentSelection', function () {
    var id = 'testContainer';

    beforeEach(function () {
      this.$container = $('<div id="' + id + '"></div>').appendTo('body');
    });

    afterEach(function () {
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
      var text = "";
      if (window.getSelection //IE8
        && window.getSelection().toString()
        && $(window.getSelection()).attr('type') != "Caret") {
        text = window.getSelection();
        return text.toString();
      }
      else { //standards
        var selection = document.selection && document.selection.createRange();

        if (!(typeof selection === "undefined")
          && selection.text
          && selection.text.toString()) {
          text = selection.text;
          return text.toString();
        }
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
      var doc = window.document, sel, range;
      if (window.getSelection && doc.createRange) { //standards
        sel = window.getSelection();
        range = doc.createRange();
        range.setStartBefore(fromEl, 0);
        while (siblings > 1) {
          fromEl = fromEl.nextSibling;
          siblings--;
        }
        range.setEndAfter(fromEl, 0);
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (doc.body.createTextRange) { //IE8
        range = doc.body.createTextRange();
        range.moveToElementText(fromEl);
        range.moveEnd('word', siblings + 1);
        range.select();
      }
    }

    describe('constructor', function () {
      it('should disallow fragmentSelection when set to false', function () {
        handsontable({
          data: createSpreadsheetData(4, 4),
          fragmentSelection: false
        });
        selectElementText(this.$container.find('tr:eq(0) td:eq(1)')[0], 3);

        mouseDown(this.$container.find('tr:eq(0) td:eq(3)'));
        mouseUp(this.$container.find('tr:eq(0) td:eq(3)'));

        var sel = getSelected();
        expect(sel).toEqual(false);
      });

      it('should allow fragmentSelection when set to true', function () {
        handsontable({
          data: createSpreadsheetData(4, 4),
          fragmentSelection: true
        });
        selectElementText(this.$container.find('td')[1], 3);

        mouseDown(this.$container.find('tr:eq(0) td:eq(3)'));
        mouseUp(this.$container.find('tr:eq(0) td:eq(3)'));

        var sel = getSelected();
        sel = sel.replace(/\s/g, ''); //tabs and spaces between <td>s are inconsistent in browsers, so let's ignore them
        expect(sel).toEqual('B0C0D0');
      });

      it('should disallow fragmentSelection of Handsontable chrome (anything that is not table) when set to false', function () {
        handsontable({
          data: createSpreadsheetData(4, 4),
          fragmentSelection: false
        });
        var $div = $('<div style="position: absolute; top: 0; left: 0">Text</div>');
        this.$container.append($div);
        selectElementText($div[0], 1);

        mouseDown($div);

        var sel = getSelected();
        expect(sel).toEqual(false);
      });

      it('should disallow fragmentSelection of Handsontable chrome (anything that is not table) when set to true', function () {
        handsontable({
          data: createSpreadsheetData(4, 4),
          fragmentSelection: true
        });
        var $div = $('<div style="position: absolute; top: 0; left: 0">Text</div>');
        this.$container.append($div);
        selectElementText($div[0], 1);

        mouseDown($div);

        var sel = getSelected();
        expect(sel).toEqual(false);
      });
    });

    describe('dynamic', function () {
      it('should disallow fragmentSelection when set to false', function () {
        handsontable({
          data: createSpreadsheetData(4, 4),
          fragmentSelection: true
        });
        updateSettings({fragmentSelection: false});
        selectElementText(this.$container.find('tr:eq(0) td:eq(1)')[0], 3);

        mouseDown(this.$container.find('tr:eq(0) td:eq(3)'));
        mouseUp(this.$container.find('tr:eq(0) td:eq(3)'));

        var sel = getSelected();
        expect(sel).toEqual(false);
      });

      it('should allow fragmentSelection when set to true', function () {
        handsontable({
          data: createSpreadsheetData(4, 4),
          fragmentSelection: false
        });
        updateSettings({fragmentSelection: true});
        selectElementText(this.$container.find('td')[1], 3);

        mouseDown(this.$container.find('tr:eq(0) td:eq(3)'));
        mouseUp(this.$container.find('tr:eq(0) td:eq(3)'));

        var sel = getSelected();
        sel = sel.replace(/\s/g, ''); //tabs and spaces between <td>s are inconsistent in browsers, so let's ignore them
        expect(sel).toEqual('B0C0D0');
      });
    });
  });
});