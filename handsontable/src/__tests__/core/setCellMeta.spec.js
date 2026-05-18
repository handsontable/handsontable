describe('Core.setCellMeta', () => {
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

  it('should set correct meta className for cell', async() => {

    const className = 'htCenter htMiddle';

    handsontable({
      afterCellMetaReset() {
        this.setCellMeta(0, 0, 'className', className);
      }
    });

    const cellMeta = getCellMeta(0, 0);

    expect(cellMeta.className).not.toBeUndefined();
    expect(cellMeta.className).toEqual(className);
  });

  it('should set proper cell meta when indexes was modified', async() => {
    handsontable({
      minRows: 5,
      minCols: 5
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    await setCellMeta(0, 1, 'key', 'value');

    expect(getCellMeta(0, 1).key).toEqual('value');
  });

  it('should set correct meta className for non existed cell', async() => {
    const className = 'htCenter htMiddle';

    handsontable({
      data: createSpreadsheetData(5, 5),
      afterCellMetaReset() {
        this.setCellMeta(100, 100, 'className', className);
      }
    });

    const cellMeta = getCellMeta(100, 100);

    expect(cellMeta.className).not.toBeUndefined();
    expect(cellMeta.className).toEqual(className);
  });

  it('should set correct meta classNames for cells using cell in configuration', async() => {
    const classNames = [
      'htCenter htTop',
      'htRight htBottom'
    ];

    handsontable({
      cell: [
        { row: 0, col: 0, className: classNames[0] },
        { row: 1, col: 1, className: classNames[1] }
      ]
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)')[0].className).toEqual(classNames[0]);
    expect(spec().$container.find('tbody tr:eq(1) td:eq(1)')[0].className).toEqual(classNames[1]);
  });

  it('should change cell meta data with updateSettings when the cell option is defined', async() => {
    const classNames = [
      'htCenter htTop',
      'htRight htBottom'
    ];

    handsontable({
      cell: [
        { row: 0, col: 0, className: classNames[0] },
        { row: 1, col: 1, className: classNames[1] }
      ]
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)')[0].className).toEqual(classNames[0]);
    expect(spec().$container.find('tbody tr:eq(1) td:eq(1)')[0].className).toEqual(classNames[1]);

    await updateSettings({
      cell: []
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)')[0].className).toEqual('');
    expect(spec().$container.find('tbody tr:eq(1) td:eq(1)')[0].className).toEqual('');

    await updateSettings({
      cell: [
        { row: 0, col: 0, className: classNames[1] },
        { row: 1, col: 1, className: classNames[0] }
      ]
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)')[0].className).toEqual(classNames[1]);
    expect(spec().$container.find('tbody tr:eq(1) td:eq(1)')[0].className).toEqual(classNames[0]);
  });

  it('should call `beforeSetCellMeta` and `afterSetCellMeta` plugin hook with visual indexes as parameters', async() => {
    const className = 'htCenter htMiddle';
    const beforeSetCellMeta = jasmine.createSpy('beforeSetCellMeta');
    const afterSetCellMeta = jasmine.createSpy('afterSetCellMeta');

    handsontable({
      minRows: 5,
      minCols: 5,
      beforeSetCellMeta,
      afterSetCellMeta
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    setCellMeta(0, 1, 'className', className);

    expect(beforeSetCellMeta).toHaveBeenCalledWith(0, 1, 'className', className);
    expect(afterSetCellMeta).toHaveBeenCalledWith(0, 1, 'className', className);
  });

  it('should NOT call the `afterSetCellMeta` hook, if the `beforeSetCellMeta` returned false', async() => {
    const className = 'htCenter htMiddle';
    const afterSetCellMeta = jasmine.createSpy('afterSetCellMeta');

    handsontable({
      minRows: 5,
      minCols: 5,
      beforeSetCellMeta: () => false,
      afterSetCellMeta
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    setCellMeta(0, 1, 'className', className);

    expect(afterSetCellMeta).not.toHaveBeenCalled();
  });

  it('should extend the the meta object with `type` setting', async() => {
    const { getCellType } = Handsontable.cellTypes;

    handsontable();

    expect(getCellMeta(0, 0).type).toBe('text');
    expect(getCellMeta(0, 0).renderer).toBe(getCellType('text').renderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('text').editor);

    await setCellMeta(0, 0, 'type', 'autocomplete');
    await render();

    expect(getCellMeta(0, 0).type).toBe(getCellType('autocomplete').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toBe(getCellType('autocomplete').renderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('autocomplete').editor);

    await setCellMeta(0, 0, 'type', 'password');
    await render();

    expect(getCellMeta(0, 0).type).toBe(getCellType('password').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toBe(getCellType('password').renderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('password').editor);

    await setCellMeta(0, 0, 'type', 'numeric');
    await render();

    expect(getCellMeta(0, 0).type).toBe(getCellType('numeric').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toBe(getCellType('numeric').renderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('numeric').editor);
  });

  it('should not overwrite the manually defined `renderer` and `editor` props by setting a `type` meta prop', async() => {
    const mockRenderer = () => {};
    const mockEditor = () => {};
    const { getCellType } = Handsontable.cellTypes;

    handsontable();

    expect(getCellMeta(0, 0).type).toBe('text');
    expect(getCellMeta(0, 0).renderer).toBe(getCellType('text').renderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('text').editor);

    await setCellMeta(0, 0, 'renderer', mockRenderer);
    await setCellMeta(0, 0, 'type', 'autocomplete');
    await render();

    expect(getCellMeta(0, 0).type).toBe(getCellType('autocomplete').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toBe(mockRenderer);
    expect(getCellMeta(0, 0).editor).toBe(getCellType('autocomplete').editor);

    await setCellMeta(0, 0, 'editor', mockEditor);
    await setCellMeta(0, 0, 'type', 'password');
    await render();

    expect(getCellMeta(0, 0).type).toBe(getCellType('password').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toBe(mockRenderer);
    expect(getCellMeta(0, 0).editor).toBe(mockEditor);
  });
});
