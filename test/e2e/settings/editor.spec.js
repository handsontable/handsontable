describe('settings', () => {
  describe('editor', () => {
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

    describe('defined in constructor', () => {
      it('should use text editor by default', () => {
        const textEditorPrototype = Handsontable.editors.TextEditor.prototype;

        spyOn(textEditorPrototype, 'init').and.callThrough();
        handsontable();
        selectCell(0, 0);
        expect(textEditorPrototype.init).toHaveBeenCalled();
      });

      it('should use editor from predefined string', () => {
        const textEditorPrototype = Handsontable.editors.TextEditor.prototype;
        const checkboxEditorPrototype = Handsontable.editors.CheckboxEditor.prototype;

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

      it('should use editor from predefined string when columns is a function', () => {
        const textEditorPrototype = Handsontable.editors.TextEditor.prototype;
        const checkboxEditorPrototype = Handsontable.editors.CheckboxEditor.prototype;

        spyOn(textEditorPrototype, 'init');
        spyOn(checkboxEditorPrototype, 'init');
        handsontable({
          columns(column) {
            return column === 0 ? { editor: 'checkbox' } : null;
          }
        });
        selectCell(0, 0);
        expect(textEditorPrototype.init).not.toHaveBeenCalled();
        expect(checkboxEditorPrototype.init).toHaveBeenCalled();
      });

      it('should use editor class passed directly', () => {
        const customEditor = jasmine.createSpy('customEditor');

        customEditor.and.callFake(function() {
          this.prepare = function() {};
          this.isOpened = function() {};
        });

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

      it('should use editor class passed directly when columns is a function', () => {
        const customEditor = jasmine.createSpy('customEditor');

        customEditor.and.callFake(function() {
          this.prepare = function() {};
          this.isOpened = function() {};
        });

        handsontable({
          columns(column) {
            return column === 0 ? { editor: customEditor } : null;
          }
        });
        selectCell(0, 0);

        expect(customEditor).toHaveBeenCalled();
      });

      it('should use editor from custom string', () => {
        const customEditor = jasmine.createSpy('customEditor');
        customEditor.and.callFake(function() {
          this.prepare = function() {};
          this.isOpened = function() {};
        });

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

      it('should use editor from custom string when columns is a function', () => {
        const customEditor = jasmine.createSpy('customEditor');

        customEditor.and.callFake(function() {
          this.prepare = function() {};
          this.isOpened = function() {};
        });

        Handsontable.editors.registerEditor('myEditor', customEditor);

        handsontable({
          columns(column) {
            return column === 0 ? { editor: 'myEditor' } : null;
          },
        });
        selectCell(0, 0);

        expect(customEditor).toHaveBeenCalled();
      });
    });
  });
});
