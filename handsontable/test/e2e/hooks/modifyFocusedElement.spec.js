describe('`modifyFocusedElement` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should trigger the hook with the correct arguments every time a cell is selected', () => {
    const hookSpy = jasmine.createSpy('modifyFocusedElementSpy');

    handsontable({
      data: createSpreadsheetData(4, 4),
      colHeaders: true,
      rowHeaders: true,
      modifyFocusedElement: hookSpy
    });

    selectCell(1, 1);

    expect(hookSpy).toHaveBeenCalledTimes(1);
    expect(hookSpy).toHaveBeenCalledWith(1, 1, getCell(1, 1, true));

    selectCell(2, 2);

    expect(hookSpy).toHaveBeenCalledTimes(2);
    expect(hookSpy).toHaveBeenCalledWith(2, 2, getCell(2, 2, true));
  });

  it('should trigger the hook with the correct arguments when the hidden cell is selected', () => {
    const hookSpy = jasmine.createSpy('modifyFocusedElementSpy');

    handsontable({
      data: createSpreadsheetData(10, 4),
      colHeaders: true,
      rowHeaders: true,
      modifyFocusedElement: hookSpy
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(1, true);
    render();

    selectCell(1, 1);

    expect(hookSpy).toHaveBeenCalledTimes(1);
    expect(hookSpy).toHaveBeenCalledWith(1, 1, null);
  });

  it('should allow modifying which element is being focused by returning an HTML element from the hook\'s callback', () => {
    const dummyElement = document.createElement('DIV');

    dummyElement.setAttribute('tabindex', -1);

    document.body.appendChild(dummyElement);

    handsontable({
      data: createSpreadsheetData(2, 4),
      colHeaders: true,
      rowHeaders: true,
      modifyFocusedElement: () => {
        return dummyElement;
      }
    });

    selectCell(1, 1);

    expect(document.activeElement).toEqual(dummyElement);

    document.body.removeChild(dummyElement);
  });
});
