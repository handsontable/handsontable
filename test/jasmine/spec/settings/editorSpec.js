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
        var textEditorPrototype = Handsontable.editors.TextEditor.prototype;
        spyOn(textEditorPrototype, 'init').andCallThrough();
        handsontable();
        selectCell(0, 0);
        expect(textEditorPrototype.init).toHaveBeenCalled();
      });

      it('should use editor from predefined string', function () {

        var textEditorPrototype = Handsontable.editors.TextEditor.prototype;
        var checkboxEditorPrototype = Handsontable.editors.CheckboxEditor.prototype;

        spyOn(textEditorPrototype, 'init');
        spyOn(checkboxEditorPrototype, 'init');
        handsontable({
          columns: [
            {
              editor: 'checkbox'
            }
          ]
        });
        selectCell(0, 0);
        expect(textEditorPrototype.init).not.toHaveBeenCalled();
        expect(checkboxEditorPrototype.init).toHaveBeenCalled();
      });

      it('should use editor class passed directly', function () {
        var customEditor = jasmine.createSpy('customEditor');
        customEditor.plan = function(){
          this.prepare = function(){};
        };

        handsontable({
          columns: [
            {
              editor: customEditor
            }
          ]
        });
        selectCell(0, 0);

        expect(customEditor).toHaveBeenCalled();
      });

      it('should use editor from custom string', function () {
        var customEditor = jasmine.createSpy('customEditor');
        customEditor.plan = function(){
          this.prepare = function(){};
        };

        Handsontable.editors.registerEditor('myEditor', customEditor);

        handsontable({
          columns: [
            {
              editor: 'myEditor'
            }
          ]
        });
        selectCell(0, 0);

        expect(customEditor).toHaveBeenCalled();
      });
    });
  });
});