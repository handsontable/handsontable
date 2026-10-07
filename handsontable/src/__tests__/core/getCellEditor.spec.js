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

  it('should return text-type editor when no `editor` or `type` is defined', async() => {
    handsontable({});

    expect(getCellEditor(1, 1)).toBe(getCellType('text').editor);
  });

  it('should return editor defined as custom function', async() => {
    const myEditor = () => {};

    handsontable({
      editor: myEditor,
    });

    expect(getCellEditor(1, 1)).toBe(myEditor);
  });

  it('should return `false` when the cell editor is disabled', async() => {
    handsontable({
      editor: false,
    });

    expect(getCellEditor(1, 1)).toBe(false);
  });

  it('should be possible to get editor using row, col coords or by passing the cell meta object', async() => {
    handsontable({
      type: 'numeric',
    });

    expect(getCellEditor(1, 1)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(getCellMeta(1, 1))).toBe(getCellType('numeric').editor);
  });

  it('should return editor defined by `editor` in the table settings and ignore the `type` setting', async() => {
    handsontable({
      type: 'numeric',
      editor: 'password',
    });

    expect(getCellEditor(1, 1)).toBe(getCellType('password').editor);
    expect(getCellEditor(getCellMeta(1, 1))).toBe(getCellType('password').editor);
  });

  it('should return editor defined by `editor` in the columns and cells setting and ignore the `type` setting', async() => {
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

  it('should return numeric-type editor when the `type` is defined in the global settings', async() => {
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

  it('should return numeric-type editor when the `editor` is defined in the global settings', async() => {
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

  it('should return correct type editors defined as `type` according to column settings', async() => {
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

  it('should return correct type editors defined as `editor` according to column settings', async() => {
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
     'the dataset range', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      type: 'numeric',
    });

    expect(getCellEditor(5, 1)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(1, 5)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(100, 100)).toBe(getCellType('numeric').editor);
  });

  it('should return type editor defined as `editor` in the table setting when the coords targets beyond ' +
     'the dataset range', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      editor: 'numeric',
    });

    expect(getCellEditor(5, 1)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(1, 5)).toBe(getCellType('numeric').editor);
    expect(getCellEditor(100, 100)).toBe(getCellType('numeric').editor);
  });

  it('should return type editor defined as `type` in the columns setting when the coords targets beyond ' +
     'the dataset range', async() => {
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
     'the dataset range', async() => {
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

  describe('`editor` set to `true`', () => {
    // `true` names no editor, so it has to read as "not passed" - the cell keeps the editor its
    // `type` (or a higher configuration level) provides. Returning the raw `true` made
    // `getEditorInstance()` throw on the first edit (GH #7561 follow-up).
    it('should return the default text editor when only `editor: true` is defined', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        editor: true,
      });

      expect(getCellEditor(1, 1)).toBe(getCellType('text').editor);
    });

    it('should return the `type` editor when `editor: true` is defined next to a `type`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        columns: [
          { type: 'numeric', editor: true },
          { type: 'password', editor: true },
          {},
        ],
      });

      expect(getCellEditor(1, 0)).toBe(getCellType('numeric').editor);
      expect(getCellEditor(1, 1)).toBe(getCellType('password').editor);
      // control column - proves the harness resolves editors at all
      expect(getCellEditor(1, 2)).toBe(getCellType('text').editor);
    });

    it('should return the editor inherited from the grid level', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        editor: 'password',
        columns: [
          { editor: true },
          {},
        ],
      });

      expect(getCellEditor(1, 0)).toBe(getCellType('password').editor);
    });

    it('should return the default text editor when passed through the `cell` option', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        cell: [
          { row: 1, col: 1, editor: true },
        ],
      });

      expect(getCellEditor(1, 1)).toBe(getCellType('text').editor);
    });

    it('should return the `type` editor when passed through the `cell` option', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        cell: [
          { row: 1, col: 1, type: 'numeric', editor: true },
        ],
      });

      // The `cell` option does not go through the layer `updateMeta` calls - it lands in
      // `CellMeta#setMeta`, which used to store the raw `true` as an own property and so blocked
      // the `type` expansion from supplying the numeric editor.
      expect(getCellEditor(1, 1)).toBe(getCellType('numeric').editor);
      expect(getCellMeta(1, 1).editor).not.toBe(true);
    });

    it('should keep the inherited editor when `setCellMeta` writes an `editor` of `true`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        editor: 'password',
      });

      setCellMeta(1, 1, 'editor', true);

      expect(getCellEditor(1, 1)).toBe(getCellType('password').editor);
      expect(getCellMeta(1, 1).editor).not.toBe(true);
    });

    it('should not drop a grid-level editor when `updateSettings` passes an `editor` of `true`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        editor: 'password',
      });

      await updateSettings({ editor: true });

      // "Not passed" means the previous value stands, exactly as `updateSettings({})` would leave it.
      expect(getCellEditor(1, 1)).toBe(getCellType('password').editor);
      expect(getCellMeta(1, 1).editor).not.toBe(true);
    });

    it('should return the `type` editor when passed through the `cells` option', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        cells(row, column) {
          return column === 0 ? { type: 'numeric', editor: true } : {};
        },
      });

      expect(getCellEditor(1, 0)).toBe(getCellType('numeric').editor);
      expect(getCellEditor(1, 1)).toBe(getCellType('text').editor);
    });

    it('should return the default text editor after `updateSettings`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      await updateSettings({ editor: true });

      expect(getCellEditor(1, 1)).toBe(getCellType('text').editor);
    });

    it('should still disable editing for `editor: false`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        columns: [
          { type: 'numeric', editor: false },
          {},
        ],
      });

      expect(getCellEditor(1, 0)).toBe(false);
      expect(getCellEditor(1, 1)).toBe(getCellType('text').editor);
    });
  });
});
