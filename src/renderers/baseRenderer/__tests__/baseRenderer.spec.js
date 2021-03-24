describe('CellDecorator', () => {
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

  const arrayOfObjects = function() {
    return [
      { id: 1, name: 'Ted', lastName: 'Right' },
      { id: 2, name: 'Frank', lastName: 'Honest' },
      { id: 3, name: 'Joan', lastName: 'Well' }
    ];
  };

  it('should add an appropriate class name to every cell, if wordWrap=false is set to the whole table', () => {
    const hot = handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'lastName' }
      ],
      wordWrap: false
    });

    const cols = countCols();
    const rows = countRows();

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        expect($(getCell(i, j)).hasClass(hot.getSettings().noWordWrapClassName)).toBe(true);
      }
    }
  });

  it('should add an appropriate class name to every cell in a column, if wordWrap=false is set to the column settings', () => {
    const hot = handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id' },
        { data: 'name', wordWrap: false },
        { data: 'lastName' }
      ]
    });

    const rows = countRows();

    for (let i = 0; i < rows; i++) {
      expect($(getCell(i, 1)).hasClass(hot.getSettings().noWordWrapClassName)).toBe(true);
    }

    for (let i = 0; i < rows; i++) {
      expect($(getCell(i, 0)).hasClass(hot.getSettings().noWordWrapClassName)).toBe(false); // no class added to other columns
      expect($(getCell(i, 2)).hasClass(hot.getSettings().noWordWrapClassName)).toBe(false);
    }
  });

  it('should add an appropriate class to a cell, if wordWrap=false is set to a single cell', () => {
    const hot = handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'lastName' }
      ]
    });

    expect($(getCell(1, 1)).hasClass(hot.getSettings().noWordWrapClassName)).toBe(false);

    getCellMeta(1, 1).wordWrap = false;
    render();

    expect($(getCell(1, 1)).hasClass(hot.getSettings().noWordWrapClassName)).toBe(true);

  });

  it('should set "white-space" css parameter to "nowrap" if htNoWrap class is added to a cell', () => {
    handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'lastName' }
      ]
    });

    expect(window.getComputedStyle(getCell(1, 1)).whiteSpace).not.toEqual('nowrap');

    getCellMeta(1, 1).wordWrap = false;
    render();

    expect(window.getComputedStyle(getCell(1, 1)).whiteSpace).toEqual('nowrap');
  });

  it('should not add cell `htInvalid` class when trying to add not proper value', (done) => {
    const hot = handsontable({
      data: arrayOfObjects(),
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'salary', type: 'numeric', allowInvalid: false }
      ]
    });

    setDataAtCell(0, 2, 'non-numeric value');

    setTimeout(() => {
      expect($(getCell(0, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);
      done();
    }, 200);
  });

  // When PR#6425 has been approved I will move this test to className.spec.js
  it('should add all CSS classes to each cell without removing old one (passed as an array)', () => {
    handsontable({
      data: [[1, true]],
      className: ['First', 'Second', '', 'Third'],
    });

    expect(getCell(0, 0).className).toBe('First Second Third');
    expect(getCell(0, 1).className).toBe('First Second Third');
  });
});
