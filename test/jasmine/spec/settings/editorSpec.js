describe('settings', function () {
  describe('editor', function () {
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

    describe('defined in constructor', function () {
      it('should use text editor by default', function () {
        spyOn(Handsontable.TextCell, 'editor');
        handsontable();
        selectCell(0, 0);
        expect(Handsontable.TextCell.editor).toHaveBeenCalled();
      });

      it('should use editor from predefined string', function () {
        spyOn(Handsontable.TextCell, 'editor');
        spyOn(Handsontable.cellLookup.editor, 'checkbox');
        handsontable({
          columns: [
            {
              editor: 'checkbox'
            }
          ]
        });
        selectCell(0, 0);
        expect(Handsontable.TextCell.editor).not.toHaveBeenCalled();
        expect(Handsontable.cellLookup.editor.checkbox).toHaveBeenCalled();
      });

      it('should use editor from custom function', function () {
        var called = false;

        function myEditor() {
          called = true;
        }

        handsontable({
          columns: [
            {
              editor: myEditor
            }
          ]
        });
        selectCell(0, 0);

        expect(called).toBe(true);
      });

      it('should use editor from custom string', function () {
        function myEditor() {

        }

        Handsontable.cellLookup.editor.myEditor = myEditor;
        spyOn(Handsontable.cellLookup.editor, 'myEditor');

        handsontable({
          columns: [
            {
              editor: 'myEditor'
            }
          ]
        });
        selectCell(0, 0);

        expect(Handsontable.cellLookup.editor.myEditor).toHaveBeenCalled();
      });
    });
  });
});