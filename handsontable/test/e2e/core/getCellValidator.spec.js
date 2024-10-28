describe('Core.getCellValidator', () => {
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

  it('should return text-type validator when no `validator` or `type` is defined', () => {
    handsontable({});

    expect(getCellValidator(1, 1)).toBe(getCellType('text').validator);
  });

  it('should return validator defined as custom function', () => {
    const myValidator = () => {};

    handsontable({
      validator: myValidator,
    });

    expect(getCellValidator(1, 1)).toBe(myValidator);
  });

  it('should return `false` when the cell validator is disabled', () => {
    handsontable({
      validator: false,
    });

    expect(getCellValidator(1, 1)).toBe(false);
  });

  it('should be possible to get validator using row, col coords or by passing the cell meta object', () => {
    handsontable({
      type: 'numeric',
    });

    expect(getCellValidator(1, 1)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(getCellMeta(1, 1))).toBe(getCellType('numeric').validator);
  });

  it('should return validator defined by `validator` in the table settings and ignore the `type` setting', () => {
    handsontable({
      type: 'numeric',
      validator: 'time',
    });

    expect(getCellValidator(1, 1)).toBe(getCellType('time').validator);
    expect(getCellValidator(getCellMeta(1, 1))).toBe(getCellType('time').validator);
  });

  it('should return validator defined by `validator` in the columns and cells setting and ignore the `type` setting', () => {
    const myValidator = () => {};
    const myValidator2 = () => {};
    const myValidator3 = () => {};

    handsontable({
      data: createSpreadsheetData(5, 5),
      columns: [
        {
          type: 'numeric',
          validator: myValidator,
        },
        {},
        {},
      ],
      cell: [
        {
          row: 1,
          col: 2,
          type: 'numeric',
          validator: myValidator3,
        },
      ],
      cells(row, column) {
        if (column === 1) {
          return {
            type: 'autocomplete',
            validator: myValidator2,
          };
        }
      }
    });

    expect(getCellValidator(0, 0)).toBe(myValidator);
    expect(getCellValidator(0, 1)).toBe(myValidator2);
    expect(getCellValidator(0, 2)).toBe(getCellType('text').validator);
    expect(getCellValidator(1, 2)).toBe(myValidator3);
    expect(getCellValidator(2, 2)).toBe(getCellType('text').validator);
  });

  it('should return numeric-type validator when the `type` is defined in the global settings', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      type: 'numeric',
    });

    expect(getCellValidator(0, 0)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(1, 1)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(2, 2)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(3, 3)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(4, 4)).toBe(getCellType('numeric').validator);
  });

  it('should return numeric-type validator when the `validator` is defined in the global settings', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      validator: 'numeric',
    });

    expect(getCellValidator(0, 0)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(1, 1)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(2, 2)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(3, 3)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(4, 4)).toBe(getCellType('numeric').validator);
  });

  it('should return correct type validators defined as `type` according to column settings', () => {
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

    expect(getCellValidator(0, 0)).toBe(getCellType('numeric').validator); // fallback to "numeric"
    expect(getCellValidator(0, 1)).toBe(getCellType('numeric').validator); // fallback to "numeric"
    expect(getCellValidator(0, 2)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(0, 3)).toBe(getCellType('autocomplete').validator);
    expect(getCellValidator(0, 4)).toBe(getCellType('numeric').validator);
  });

  it('should return correct type validators defined as `validator` according to column settings', () => {
    const myValidator = () => {};
    const myValidator2 = () => {};

    handsontable({
      data: createSpreadsheetData(5, 5),
      validator: 'numeric',
      columns: [
        { validator: myValidator },
        { validator: myValidator2 },
        { validator: 'numeric' },
        { validator: 'autocomplete' },
        {}, // fallback to "numeric"
      ]
    });

    expect(getCellValidator(0, 0)).toBe(myValidator);
    expect(getCellValidator(0, 1)).toBe(myValidator2);
    expect(getCellValidator(0, 2)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(0, 3)).toBe(getCellType('autocomplete').validator);
    expect(getCellValidator(0, 4)).toBe(getCellType('numeric').validator);
  });

  it('should return type validator defined as `type` in the table setting when the coords targets beyond ' +
     'the dataset range', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      type: 'numeric',
    });

    expect(getCellValidator(5, 1)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(1, 5)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(100, 100)).toBe(getCellType('numeric').validator);
  });

  it('should return type validator defined as `validator` in the table setting when the coords targets beyond ' +
     'the dataset range', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      validator: 'numeric',
    });

    expect(getCellValidator(5, 1)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(1, 5)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(100, 100)).toBe(getCellType('numeric').validator);
  });

  it('should return type validator defined as `type` in the columns setting when the coords targets beyond ' +
     'the dataset range', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      type: 'numeric',
      columns: [
        { type: 'text' },
        { type: 'autocomplete' },
        { type: 'numeric' },
        { type: 'autocomplete' },
        { type: 'password' },
      ]
    });

    expect(getCellValidator(5, 1)).toBe(getCellType('autocomplete').validator);
    expect(getCellValidator(1, 5)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(100, 100)).toBe(getCellType('numeric').validator);
  });

  it('should return type validator defined as `validator` in the columns setting when the coords targets beyond ' +
     'the dataset range', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      validator: 'numeric',
      columns: [
        { validator: 'text' },
        { validator: 'autocomplete' },
        { validator: 'numeric' },
        { validator: 'autocomplete' },
        { validator: 'password' },
      ]
    });

    expect(getCellValidator(5, 1)).toBe(getCellType('autocomplete').validator);
    expect(getCellValidator(1, 5)).toBe(getCellType('numeric').validator);
    expect(getCellValidator(100, 100)).toBe(getCellType('numeric').validator);
  });
});
