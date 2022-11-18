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

  it('should set correct meta className for cell', () => {

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

  it('should set proper cell meta when indexes was modified', () => {
    const hot = handsontable({
      minRows: 5,
      minCols: 5
    });

    hot.rowIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
    hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);

    setCellMeta(0, 1, 'key', 'value');

    expect(getCellMeta(0, 1).key).toEqual('value');
  });

  it('should set correct meta className for non existed cell', () => {
    const className = 'htCenter htMiddle';

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      afterCellMetaReset() {
        this.setCellMeta(100, 100, 'className', className);
      }
    });

    const cellMeta = getCellMeta(100, 100);

    expect(cellMeta.className).not.toBeUndefined();
    expect(cellMeta.className).toEqual(className);
  });

  it('should set correct meta classNames for cells using cell in configuration', () => {
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

  it('should change cell meta data with updateSettings when the cell option is defined', () => {
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

    updateSettings({
      cell: []
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)')[0].className).toEqual('');
    expect(spec().$container.find('tbody tr:eq(1) td:eq(1)')[0].className).toEqual('');

    updateSettings({
      cell: [
        { row: 0, col: 0, className: classNames[1] },
        { row: 1, col: 1, className: classNames[0] }
      ]
    });

    expect(spec().$container.find('tbody tr:eq(0) td:eq(0)')[0].className).toEqual(classNames[1]);
    expect(spec().$container.find('tbody tr:eq(1) td:eq(1)')[0].className).toEqual(classNames[0]);
  });

  it('should call `beforeSetCellMeta` and `afterSetCellMeta` plugin hook with visual indexes as parameters', () => {
    const className = 'htCenter htMiddle';
    const beforeSetCellMeta = jasmine.createSpy('beforeSetCellMeta');
    const afterSetCellMeta = jasmine.createSpy('afterSetCellMeta');
    const hot = handsontable({
      minRows: 5,
      minCols: 5,
      beforeSetCellMeta,
      afterSetCellMeta
    });

    hot.rowIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
    hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);

    hot.setCellMeta(0, 1, 'className', className);

    expect(beforeSetCellMeta).toHaveBeenCalledWith(0, 1, 'className', className);
    expect(afterSetCellMeta).toHaveBeenCalledWith(0, 1, 'className', className);
  });

  it('should NOT call the `afterSetCellMeta` hook, if the `beforeSetCellMeta` returned false', () => {
    const className = 'htCenter htMiddle';
    const afterSetCellMeta = jasmine.createSpy('afterSetCellMeta');
    const hot = handsontable({
      minRows: 5,
      minCols: 5,
      beforeSetCellMeta: () => false,
      afterSetCellMeta
    });

    hot.rowIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
    hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);

    hot.setCellMeta(0, 1, 'className', className);

    expect(afterSetCellMeta).not.toHaveBeenCalled();
  });

  it('should automatically set the `renderer` and `editor` properties when setting the `type` meta prop', () => {
    const { getCellType } = Handsontable.cellTypes;

    handsontable();

    expect(getCellMeta(0, 0).type).toEqual('text');
    expect(getCellMeta(0, 0).renderer).toBeUndefined();
    expect(getCellMeta(0, 0).editor).toBeUndefined();

    setCellMeta(0, 0, 'type', 'autocomplete');
    render();

    expect(getCellMeta(0, 0).type).toEqual(getCellType('autocomplete').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toEqual(getCellType('autocomplete').renderer);
    expect(getCellMeta(0, 0).editor).toEqual(getCellType('autocomplete').editor);

    setCellMeta(0, 0, 'type', 'password');
    render();

    expect(getCellMeta(0, 0).type).toEqual(getCellType('password').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toEqual(getCellType('password').renderer);
    expect(getCellMeta(0, 0).editor).toEqual(getCellType('password').editor);

    setCellMeta(0, 0, 'type', 'numeric');
    render();

    expect(getCellMeta(0, 0).type).toEqual(getCellType('numeric').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toEqual(getCellType('numeric').renderer);
    expect(getCellMeta(0, 0).editor).toEqual(getCellType('numeric').editor);
  });

  it('should not overwrite the manually defined `renderer` and `editor` props by setting a `type` meta prop', () => {
    const mockRenderer = () => {};
    const mockEditor = () => {};
    const { getCellType } = Handsontable.cellTypes;

    handsontable();

    expect(getCellMeta(0, 0).type).toEqual('text');
    expect(getCellMeta(0, 0).renderer).toBeUndefined();
    expect(getCellMeta(0, 0).editor).toBeUndefined();

    setCellMeta(0, 0, 'renderer', mockRenderer);
    setCellMeta(0, 0, 'type', 'autocomplete');
    render();

    expect(getCellMeta(0, 0).type).toEqual(getCellType('autocomplete').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toEqual(mockRenderer);
    expect(getCellMeta(0, 0).editor).toEqual(getCellType('autocomplete').editor);

    setCellMeta(0, 0, 'editor', mockEditor);
    setCellMeta(0, 0, 'type', 'password');
    render();

    expect(getCellMeta(0, 0).type).toEqual(getCellType('password').CELL_TYPE);
    expect(getCellMeta(0, 0).renderer).toEqual(mockRenderer);
    expect(getCellMeta(0, 0).editor).toEqual(mockEditor);
  });
});
