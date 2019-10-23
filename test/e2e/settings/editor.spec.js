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
        const td = document.createElement('td');

        customEditor.and.callFake(function() {
          this.prepare = function() {};
          this.getEditedCell = () => td;
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
        const td = document.createElement('td');

        customEditor.and.callFake(function() {
          this.prepare = function() {};
          this.getEditedCell = () => td;
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
        const td = document.createElement('td');
        customEditor.and.callFake(function() {
          this.prepare = function() {};
          this.getEditedCell = () => td;
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
        const td = document.createElement('td');

        customEditor.and.callFake(function() {
          this.prepare = function() {};
          this.getEditedCell = () => td;
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

      it('should provide correct set of arguments to the prepare callback', (done) => {
        const customEditor = jasmine.createSpy('customEditor');
        const myData = Handsontable.helper.createSpreadsheetData(1, 5);
        let editedTd;

        customEditor.and.callFake(function() {
          this.prepare = function(row, col, prop, td, originalValue, cellProperties) {
            expect(row).toEqual(0);
            expect(col).toEqual(0);
            expect(prop).toEqual(0);
            expect(td).toEqual(editedTd);
            expect(originalValue).toEqual(myData[0][0]);
            expect(cellProperties.editor).toEqual(customEditor);
            done();
          };
          this.isOpened = function() {};
        });

        handsontable({
          data: myData,
          columns: [
            {
              editor: customEditor
            }
          ]
        });
        editedTd = spec().$container.find('.ht_master td')[0];
        selectCell(0, 0);
      });

      it('should provide correct set of arguments to the prepare callback (fixed column, cell rendered overlay but not rendered on master)', (done) => {
        // https://github.com/handsontable/handsontable/issues/6043
        const customEditor = jasmine.createSpy('customEditor');
        const myData = Handsontable.helper.createSpreadsheetData(1, 5);
        let editedTd;

        customEditor.and.callFake(function() {
          this.prepare = function(row, col, prop, td, originalValue, cellProperties) {
            expect(row).toEqual(0);
            expect(col).toEqual(0);
            expect(prop).toEqual(0);
            expect(td).toEqual(editedTd);
            expect(originalValue).toEqual(myData[0][0]);
            expect(cellProperties.editor).toEqual(customEditor);
            done();
          };
          this.isOpened = function() {};
        });

        handsontable({
          data: myData,
          cells(row, col) {
            if (col === 0) {
              return { editor: customEditor };
            }
          },
          colWidths: 100,
          width: 400,
          fixedColumnsLeft: 1,
          viewportColumnRenderingOffset: 0,
        });
        editedTd = spec().$container.find('.ht_clone_left td')[0];
        selectCell(0, 0);
      });
    });
  });
});
