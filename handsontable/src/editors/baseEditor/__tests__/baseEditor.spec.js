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

  it('should blur `activeElement` while preparing the editor to open', () => {
    const externalInputElement = document.createElement('input');

    document.body.appendChild(externalInputElement);
    spyOn(externalInputElement, 'blur').and.callThrough();

    handsontable();

    externalInputElement.select();
    selectCell(2, 2);

    expect(externalInputElement.blur).toHaveBeenCalled();
    expect(document.activeElement).not.toBe(externalInputElement);

    document.body.removeChild(externalInputElement);
  });

  it('should not blur `activeElement` when previously active element is HoT component', () => {
    const hotInputElement = document.createElement('input');

    hotInputElement.setAttribute('data-hot-input', true);
    document.body.appendChild(hotInputElement);
    spyOn(hotInputElement, 'blur').and.callThrough();

    handsontable();

    hotInputElement.select();
    selectCell(2, 2);

    expect(hotInputElement.blur).not.toHaveBeenCalled();

    document.body.removeChild(hotInputElement);
  });

  it('should blur `activeElement` while preparing the editor to open even when readOnly is enabled', () => {
    const externalInputElement = document.createElement('input');

    document.body.appendChild(externalInputElement);
    spyOn(externalInputElement, 'blur').and.callThrough();

    handsontable({
      readOnly: true,
    });

    externalInputElement.select();
    selectCell(2, 2);

    expect(externalInputElement.blur).toHaveBeenCalled();
    expect(document.activeElement).not.toBe(externalInputElement);

    document.body.removeChild(externalInputElement);
  });

  describe('should populate value from the currently active cell to every cell in the selected range', () => {
    it('Ctrl/Meta + Enter when editor is active', () => {
      handsontable({
        data: createSpreadsheetData(6, 6)
      });

      selectCell(1, 1, 2, 2);
      keyDownUp('F2');
      keyDownUp(['control/meta', 'enter']);

      expect(getDataAtCell(1, 1)).toBe('B2');
      expect(getDataAtCell(1, 2)).toBe('B2');
      expect(getDataAtCell(2, 1)).toBe('B2');
      expect(getDataAtCell(2, 2)).toBe('B2');
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 1,1 to: 2,2']);

      loadData(createSpreadsheetData(6, 6));
      selectCell(1, 2, 2, 1);
      keyDownUp('F2');
      keyDownUp(['control/meta', 'enter']);

      expect(getDataAtCell(1, 1)).toBe('C2');
      expect(getDataAtCell(1, 2)).toBe('C2');
      expect(getDataAtCell(2, 1)).toBe('C2');
      expect(getDataAtCell(2, 2)).toBe('C2');
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,2 to: 2,1']);

      loadData(createSpreadsheetData(6, 6));
      selectCell(2, 2, 1, 1);
      keyDownUp('F2');
      keyDownUp(['control/meta', 'enter']);

      expect(getDataAtCell(1, 1)).toBe('C3');
      expect(getDataAtCell(1, 2)).toBe('C3');
      expect(getDataAtCell(2, 1)).toBe('C3');
      expect(getDataAtCell(2, 2)).toBe('C3');
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 2,2 to: 1,1']);

      loadData(createSpreadsheetData(6, 6));
      selectCell(2, 1, 1, 2);
      keyDownUp('F2');
      keyDownUp(['control/meta', 'enter']);

      expect(getDataAtCell(1, 1)).toBe('B3');
      expect(getDataAtCell(1, 2)).toBe('B3');
      expect(getDataAtCell(2, 1)).toBe('B3');
      expect(getDataAtCell(2, 2)).toBe('B3');
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 2,1 to: 1,2']);
    });

    it('Ctrl/Meta + Shift + Enter when editor is active', () => {
      handsontable({
        data: createSpreadsheetData(6, 6)
      });

      selectCell(1, 1, 2, 2);
      keyDownUp('F2');
      keyDownUp(['control/meta', 'shift', 'enter']);

      expect(getDataAtCell(1, 1)).toBe('B2');
      expect(getDataAtCell(1, 2)).toBe('B2');
      expect(getDataAtCell(2, 1)).toBe('B2');
      expect(getDataAtCell(2, 2)).toBe('B2');
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,1 to: 2,2']);

      loadData(createSpreadsheetData(6, 6));
      selectCell(1, 2, 2, 1);
      keyDownUp('F2');
      keyDownUp(['control/meta', 'shift', 'enter']);

      expect(getDataAtCell(1, 1)).toBe('C2');
      expect(getDataAtCell(1, 2)).toBe('C2');
      expect(getDataAtCell(2, 1)).toBe('C2');
      expect(getDataAtCell(2, 2)).toBe('C2');
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 1,2 to: 2,1']);

      loadData(createSpreadsheetData(6, 6));
      selectCell(2, 2, 1, 1);
      keyDownUp('F2');
      keyDownUp(['control/meta', 'shift', 'enter']);

      expect(getDataAtCell(1, 1)).toBe('C3');
      expect(getDataAtCell(1, 2)).toBe('C3');
      expect(getDataAtCell(2, 1)).toBe('C3');
      expect(getDataAtCell(2, 2)).toBe('C3');
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 2,2 to: 1,1']);

      loadData(createSpreadsheetData(6, 6));
      selectCell(2, 1, 1, 2);
      keyDownUp('F2');
      keyDownUp(['control/meta', 'shift', 'enter']);

      expect(getDataAtCell(1, 1)).toBe('B3');
      expect(getDataAtCell(1, 2)).toBe('B3');
      expect(getDataAtCell(2, 1)).toBe('B3');
      expect(getDataAtCell(2, 2)).toBe('B3');
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 2,1 to: 1,2']);
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
