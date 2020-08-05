describe('BaseEditor', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px; overflow: auto"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should exported all editors into Handsontable.editors object', () => {
    expect(Handsontable.editors.AutocompleteEditor).toBeDefined();
    expect(Handsontable.editors.BaseEditor).toBeDefined();
    expect(Handsontable.editors.CheckboxEditor).toBeDefined();
    expect(Handsontable.editors.DateEditor).toBeDefined();
    expect(Handsontable.editors.DropdownEditor).toBeDefined();
    expect(Handsontable.editors.HandsontableEditor).toBeDefined();
    expect(Handsontable.editors.NumericEditor).toBeDefined();
    expect(Handsontable.editors.PasswordEditor).toBeDefined();
    expect(Handsontable.editors.SelectEditor).toBeDefined();
    expect(Handsontable.editors.TextEditor).toBeDefined();
  });

  it('should blur activeElement while preparing the editor to open', () => {
    const externalInputElement = document.createElement('input');

    document.body.appendChild(externalInputElement);

    handsontable();

    externalInputElement.select();
    selectCell(2, 2);

    expect(document.activeElement).not.toBe(externalInputElement);

    document.body.removeChild(externalInputElement);
  });

  it('should blur activeElement while preparing the editor to open even when readOnly is enabled', () => {
    const externalInputElement = document.createElement('input');

    document.body.appendChild(externalInputElement);

    handsontable({
      readOnly: true,
    });

    externalInputElement.select();
    selectCell(2, 2);

    expect(document.activeElement).not.toBe(externalInputElement);

    document.body.removeChild(externalInputElement);
  });

  describe('ctrl + enter when editor is active', () => {
    it('should populate value from the currently active cell to every cell in the selected range', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(6, 6)
      });

      selectCell(1, 1, 2, 2);

      expect(getDataAtCell(1, 1)).toEqual('B2');
      expect(getDataAtCell(2, 2)).toEqual('C3');

      keyDown(Handsontable.helper.KEY_CODES.ENTER);
      keyDown('ctrl+enter');

      expect(getDataAtCell(1, 1)).toEqual('B2');
      expect(getDataAtCell(1, 2)).toEqual('B2');
      expect(getDataAtCell(2, 1)).toEqual('B2');
      expect(getDataAtCell(2, 2)).toEqual('B2');

      loadData(Handsontable.helper.createSpreadsheetData(6, 6));

      selectCell(1, 2, 2, 1);

      expect(getDataAtCell(1, 2)).toEqual('C2');
      expect(getDataAtCell(2, 1)).toEqual('B3');

      keyDown(Handsontable.helper.KEY_CODES.ENTER);
      keyDown('ctrl+enter');

      expect(getDataAtCell(1, 1)).toEqual('C2');
      expect(getDataAtCell(1, 2)).toEqual('C2');
      expect(getDataAtCell(2, 1)).toEqual('C2');
      expect(getDataAtCell(2, 2)).toEqual('C2');

      loadData(Handsontable.helper.createSpreadsheetData(6, 6));
      selectCell(2, 2, 1, 1);
      expect(getDataAtCell(2, 2)).toEqual('C3');

      keyDown(Handsontable.helper.KEY_CODES.ENTER);
      keyDown('ctrl+enter');

      expect(getDataAtCell(1, 1)).toEqual('C3');
      expect(getDataAtCell(1, 2)).toEqual('C3');
      expect(getDataAtCell(2, 1)).toEqual('C3');
      expect(getDataAtCell(2, 2)).toEqual('C3');

      loadData(Handsontable.helper.createSpreadsheetData(6, 6));
      selectCell(2, 1, 1, 2);
      expect(getDataAtCell(2, 1)).toEqual('B3');

      keyDown(Handsontable.helper.KEY_CODES.ENTER);
      keyDown('ctrl+enter');

      expect(getDataAtCell(1, 1)).toEqual('B3');
      expect(getDataAtCell(1, 2)).toEqual('B3');
      expect(getDataAtCell(2, 1)).toEqual('B3');
      expect(getDataAtCell(2, 2)).toEqual('B3');
    });
  });

  describe('IME support', () => {
    it('should not throw an error when composition is started in multiple instances environment', async() => {
      const errorSpy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = errorSpy.test;

      const hot1 = handsontable({});
      const container2 = $(`<div id="${id}2" style="width: 300px; height: 200px; overflow: auto"></div>`)
        .appendTo('body');
      const hot2 = container2.handsontable().handsontable('getInstance');

      $(hot1.getCell(1, 1)).simulate('mousedown');
      $(hot1.getCell(1, 1)).simulate('mouseover');
      $(hot1.getCell(1, 1)).simulate('mouseup');

      document.documentElement.dispatchEvent(new CompositionEvent('compositionstart'));

      $(hot2.getCell(1, 1)).simulate('mousedown');
      $(hot2.getCell(1, 1)).simulate('mouseover');
      $(hot2.getCell(1, 1)).simulate('mouseup');

      document.documentElement.dispatchEvent(new CompositionEvent('compositionstart'));

      expect(errorSpy.test).not.toHaveBeenCalled();

      hot2.destroy();
      container2.remove();
      window.onerror = prevError;
    });
  });
});
