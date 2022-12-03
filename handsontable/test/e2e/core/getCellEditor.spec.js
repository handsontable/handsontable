describe('Core.getCellEditor', () => {
  const id = 'testContainer';
  const { getCellType } = Handsontable.cellTypes;

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return text-type editor when no `editor` or `type` is defined', () => {
    handsontable({});

    expect(getCellEditor(1, 1)).toBe(getCellType('text').editor);
  });

  it('should return editor defined as custom function', () => {
    const myEditor = () => {};

    handsontable({
      editor: myEditor,
    });

    expect(getCellEditor(1, 1)).toBe(myEditor);
  });

  it('should return `false` when the cell editor is disabled', () => {
    handsontable({
      editor: false,
    });

    expect(getCellEditor(1, 1)).toBe(false);
  });

  it('should be possible to get editor using row, col coords or by passing the cell meta object', () => {
    handsontable({
      type: 'numeric',
    });

    expect(getCellEditor(1, 1)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(getCellMeta(1, 1))).toBe(getCellType('numeric').editor);
  });

  it('should return editor defined by `editor` in the table settings and ignore the `type` setting', () => {
    handsontable({
      type: 'numeric',
      editor: 'password',
    });

    expect(getCellEditor(1, 1)).toBe(getCellType('password').editor);
    expect(getCellEditor(getCellMeta(1, 1))).toBe(getCellType('password').editor);
  });

  it('should return editor defined by `editor` in the columns and cells setting and ignore the `type` setting', () => {
    const myEditor = () => {};
    const myEditor2 = () => {};
    const myEditor3 = () => {};

    handsontable({
      data: createSpreadsheetData(5, 5),
      columns: [
        {
          type: 'numeric',
          editor: myEditor,
        },
        {},
        {},
      ],
      cell: [
        {
          row: 1,
          col: 2,
          type: 'numeric',
          editor: myEditor3,
        },
      ],
      cells(row, column) {
        if (column === 1) {
          return {
            type: 'autocomplete',
            editor: myEditor2,
          };
        }
      }
    });

    expect(getCellEditor(0, 0)).toBe(myEditor);
    expect(getCellEditor(0, 1)).toBe(myEditor2);
    expect(getCellEditor(0, 2)).toBe(getCellType('text').editor);
    expect(getCellEditor(1, 2)).toBe(myEditor3);
    expect(getCellEditor(2, 2)).toBe(getCellType('text').editor);
  });

  it('should return numeric-type editor when the `type` is defined in the global settings', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      type: 'numeric',
    });

    expect(getCellEditor(0, 0)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(1, 1)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(2, 2)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(3, 3)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(4, 4)).toBe(getCellType('numeric').editor);
  });

  it('should return numeric-type editor when the `editor` is defined in the global settings', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      editor: 'numeric',
    });

    expect(getCellEditor(0, 0)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(1, 1)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(2, 2)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(3, 3)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(4, 4)).toBe(getCellType('numeric').editor);
  });

  it('should return correct type editors defined as `type` according to column settings', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      type: 'numeric',
      columns: [
        { type: 'text' },
        { type: 'password' },
        { type: 'numeric' },
        { type: 'autocomplete' },
        {}, // fallback to "numeric"
      ]
    });

    expect(getCellEditor(0, 0)).toBe(getCellType('text').editor);
    expect(getCellEditor(0, 1)).toBe(getCellType('password').editor);
    expect(getCellEditor(0, 2)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(0, 3)).toBe(getCellType('autocomplete').editor);
    expect(getCellEditor(0, 4)).toBe(getCellType('numeric').editor);
  });

  it('should return correct type editors defined as `editor` according to column settings', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      editor: 'numeric',
      columns: [
        { editor: 'text' },
        { editor: 'password' },
        { editor: 'numeric' },
        { editor: 'autocomplete' },
        {}, // fallback to "numeric"
      ]
    });

    expect(getCellEditor(0, 0)).toBe(getCellType('text').editor);
    expect(getCellEditor(0, 1)).toBe(getCellType('password').editor);
    expect(getCellEditor(0, 2)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(0, 3)).toBe(getCellType('autocomplete').editor);
    expect(getCellEditor(0, 4)).toBe(getCellType('numeric').editor);
  });

  it('should return type editor defined as `type` in the table setting when the coords targets beyond ' +
     'the dataset range', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      type: 'numeric',
    });

    expect(getCellEditor(5, 1)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(1, 5)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(100, 100)).toBe(getCellType('numeric').editor);
  });

  it('should return type editor defined as `editor` in the table setting when the coords targets beyond ' +
     'the dataset range', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      editor: 'numeric',
    });

    expect(getCellEditor(5, 1)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(1, 5)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(100, 100)).toBe(getCellType('numeric').editor);
  });

  it('should return type editor defined as `type` in the columns setting when the coords targets beyond ' +
     'the dataset range', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      type: 'numeric',
      columns: [
        { type: 'text' },
        { type: 'password' },
        { type: 'numeric' },
        { type: 'autocomplete' },
        { type: 'password' },
      ]
    });

    expect(getCellEditor(5, 1)).toBe(getCellType('password').editor);
    expect(getCellEditor(1, 5)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(100, 100)).toBe(getCellType('numeric').editor);
  });

  it('should return type editor defined as `editor` in the columns setting when the coords targets beyond ' +
     'the dataset range', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      editor: 'numeric',
      columns: [
        { editor: 'text' },
        { editor: 'password' },
        { editor: 'numeric' },
        { editor: 'autocomplete' },
        { editor: 'password' },
      ]
    });

    expect(getCellEditor(5, 1)).toBe(getCellType('password').editor);
    expect(getCellEditor(1, 5)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(100, 100)).toBe(getCellType('numeric').editor);
  });
});
