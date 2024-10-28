describe('Core.getCellRenderer', () => {
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

  it('should return text-type renderer when no `renderer` or `type` is defined', () => {
    handsontable({});

    expect(getCellRenderer(1, 1)).toBe(getCellType('text').renderer);
  });

  it('should return renderer defined as custom function', () => {
    const myRenderer = () => {};

    handsontable({
      renderer: myRenderer,
    });

    expect(getCellRenderer(1, 1)).toBe(myRenderer);
  });

  it('should be possible to get renderer using row, col coords or by passing the cell meta object', () => {
    handsontable({
      type: 'numeric',
    });

    expect(getCellRenderer(1, 1)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(getCellMeta(1, 1))).toBe(getCellType('numeric').renderer);
  });

  it('should return renderer defined by `renderer` in the table settings and ignore the `type` setting', () => {
    handsontable({
      type: 'numeric',
      renderer: 'password',
    });

    expect(getCellRenderer(1, 1)).toBe(getCellType('password').renderer);
    expect(getCellRenderer(getCellMeta(1, 1))).toBe(getCellType('password').renderer);
  });

  it('should return renderer defined by `renderer` in the columns and cells setting and ignore the `type` setting', () => {
    const myRenderer = () => {};
    const myRenderer2 = () => {};
    const myRenderer3 = () => {};

    handsontable({
      data: createSpreadsheetData(5, 5),
      columns: [
        {
          type: 'numeric',
          renderer: myRenderer,
        },
        {},
        {},
      ],
      cell: [
        {
          row: 1,
          col: 2,
          type: 'numeric',
          renderer: myRenderer3,
        },
      ],
      cells(row, column) {
        if (column === 1) {
          return {
            type: 'autocomplete',
            renderer: myRenderer2,
          };
        }
      }
    });

    expect(getCellRenderer(0, 0)).toBe(myRenderer);
    expect(getCellRenderer(0, 1)).toBe(myRenderer2);
    expect(getCellRenderer(0, 2)).toBe(getCellType('text').renderer);
    expect(getCellRenderer(1, 2)).toBe(myRenderer3);
    expect(getCellRenderer(2, 2)).toBe(getCellType('text').renderer);
  });

  it('should return numeric-type renderer when the `type` is defined in the global settings', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      type: 'numeric',
    });

    expect(getCellRenderer(0, 0)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(1, 1)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(2, 2)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(3, 3)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(4, 4)).toBe(getCellType('numeric').renderer);
  });

  it('should return numeric-type renderer when the `renderer` is defined in the global settings', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      renderer: 'numeric',
    });

    expect(getCellRenderer(0, 0)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(1, 1)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(2, 2)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(3, 3)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(4, 4)).toBe(getCellType('numeric').renderer);
  });

  it('should return correct type renderers defined as `type` according to column settings', () => {
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

    expect(getCellRenderer(0, 0)).toBe(getCellType('text').renderer);
    expect(getCellRenderer(0, 1)).toBe(getCellType('password').renderer);
    expect(getCellRenderer(0, 2)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(0, 3)).toBe(getCellType('autocomplete').renderer);
    expect(getCellRenderer(0, 4)).toBe(getCellType('numeric').renderer);
  });

  it('should return correct type renderers defined as `renderer` according to column settings', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      renderer: 'numeric',
      columns: [
        { renderer: 'text' },
        { renderer: 'password' },
        { renderer: 'numeric' },
        { renderer: 'autocomplete' },
        {}, // fallback to "numeric"
      ]
    });

    expect(getCellRenderer(0, 0)).toBe(getCellType('text').renderer);
    expect(getCellRenderer(0, 1)).toBe(getCellType('password').renderer);
    expect(getCellRenderer(0, 2)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(0, 3)).toBe(getCellType('autocomplete').renderer);
    expect(getCellRenderer(0, 4)).toBe(getCellType('numeric').renderer);
  });

  it('should return type renderer defined as `type` in the table setting when the coords targets beyond ' +
     'the dataset range', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      type: 'numeric',
    });

    expect(getCellRenderer(5, 1)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(1, 5)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(100, 100)).toBe(getCellType('numeric').renderer);
  });

  it('should return type renderer defined as `renderer` in the table setting when the coords targets beyond ' +
     'the dataset range', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      renderer: 'numeric',
    });

    expect(getCellRenderer(5, 1)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(1, 5)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(100, 100)).toBe(getCellType('numeric').renderer);
  });

  it('should return type renderer defined as `type` in the columns setting when the coords targets beyond ' +
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

    expect(getCellRenderer(5, 1)).toBe(getCellType('password').renderer);
    expect(getCellRenderer(1, 5)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(100, 100)).toBe(getCellType('numeric').renderer);
  });

  it('should return type renderer defined as `renderer` in the columns setting when the coords targets beyond ' +
     'the dataset range', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      renderer: 'numeric',
      columns: [
        { renderer: 'text' },
        { renderer: 'password' },
        { renderer: 'numeric' },
        { renderer: 'autocomplete' },
        { renderer: 'password' },
      ]
    });

    expect(getCellRenderer(5, 1)).toBe(getCellType('password').renderer);
    expect(getCellRenderer(1, 5)).toBe(getCellType('numeric').renderer);
    expect(getCellRenderer(100, 100)).toBe(getCellType('numeric').renderer);
  });
});
