describe('MultiColumnSorting cooperation with ColumnSorting', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="overflow: auto; width: 300px; height: 200px;"></div>`).appendTo('body');

    this.sortByClickOnColumnHeader = async(columnIndex) => {
      const hot = this.$container.data('handsontable');
      const $columnHeader = $(hot.view._wt.wtTable.getColumnHeader(columnIndex));
      const $spanInsideHeader = $columnHeader.find('.columnSorting');

      if ($spanInsideHeader.length === 0) {
        throw Error('Please check the test scenario. The header doesn\'t exist.', { cause: { handsontable: true } });
      }

      await simulateClick($spanInsideHeader);
    };
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  const arrayOfObjects = () => [
    { id: 1, name: 'Ted', lastName: 'Right' },
    { id: 2, name: 'Frank', lastName: 'Honest' },
    { id: 3, name: 'Joan', lastName: 'Well' },
    { id: 4, name: 'Sid', lastName: 'Strong' },
    { id: 5, name: 'Jane', lastName: 'Neat' },
    { id: 6, name: 'Chuck', lastName: 'Jackson' },
    { id: 7, name: 'Meg', lastName: 'Jansen' },
    { id: 8, name: 'Rob', lastName: 'Norris' },
    { id: 9, name: 'Sean', lastName: 'O\'Hara' },
    { id: 10, name: 'Eve', lastName: 'Branson' }
  ];

  it('should print warning and set the correct plugin\'s enabled state when the both plugins are enabled', async() => {
    const warnSpy = spyOn(console, 'warn');

    handsontable({
      data: arrayOfObjects(),
      colHeaders: true,
      columnSorting: true,
      multiColumnSorting: true
    });

    expect(warnSpy).toHaveBeenCalledWith('Plugins `columnSorting` and `multiColumnSorting` should not be enabled ' +
      'simultaneously. Only `columnSorting` will work. The `multiColumnSorting` plugin will remain disabled.');

    expect(getPlugin('columnSorting').enabled).toBe(true);
    expect(getPlugin('multiColumnSorting').enabled).toBe(false);
    expect(getSettings().multiColumnSorting).toBe(false);
  });

  it('should not print warnings when both plugins are enabled in different Handsontable instances', async() => {
    const warnSpy = spyOn(console, 'warn');

    handsontable({
      data: arrayOfObjects(),
      colHeaders: true,
      columnSorting: true,
    });

    const container2 = $(`<div id="${id}2"></div>`).appendTo('body');

    const hot2 = container2.handsontable({
      data: arrayOfObjects(),
      colHeaders: true,
      multiColumnSorting: true
    }).handsontable('getInstance');

    expect(warnSpy).not.toHaveBeenCalled();

    hot2.destroy();
    container2.remove();
  });

  it('should print warning and leave only ColumnSorting plugin enabled after MultiColumnSorting is tried to be enabled', async() => {
    const warnSpy = spyOn(console, 'warn');

    handsontable({
      data: arrayOfObjects(),
      colHeaders: true,
      columnSorting: true,
    });

    await updateSettings({ multiColumnSorting: true });

    expect(warnSpy).toHaveBeenCalledWith('Plugins `columnSorting` and `multiColumnSorting` should not be enabled ' +
      'simultaneously. Only `columnSorting` will work. The `multiColumnSorting` plugin will remain disabled.');

    expect(getPlugin('columnSorting').enabled).toBe(true);
    expect(getPlugin('multiColumnSorting').enabled).toBe(false);
    expect(getSettings().multiColumnSorting).toBe(false);
  });

  it('should print warning and leave only MultiColumnSorting plugin enabled after ColumnSorting is tried to be enabled', async() => {
    const warnSpy = spyOn(console, 'warn');

    handsontable({
      data: arrayOfObjects(),
      colHeaders: true,
      multiColumnSorting: true,
    });

    await updateSettings({ columnSorting: true });

    expect(warnSpy).toHaveBeenCalledWith('Plugins `columnSorting` and `multiColumnSorting` should not be enabled ' +
      'simultaneously. Only `multiColumnSorting` will work. The `columnSorting` plugin will remain disabled.');

    expect(getPlugin('columnSorting').enabled).toBe(false);
    expect(getPlugin('multiColumnSorting').enabled).toBe(true);
    expect(getSettings().columnSorting).toBe(false);
  });

  it('should column sorting (not multi-sorting) work correctly when both plugins are enabled', async() => {
    handsontable({
      colHeaders: true,
      columnSorting: true,
      multiColumnSorting: true,
    });

    await spec().sortByClickOnColumnHeader(2);
    await keyDown('control/meta');
    await spec().sortByClickOnColumnHeader(3);

    const sortedColumn1 = getCell(-1, 2, true).querySelector('span.columnSorting');
    const sortedColumn2 = getCell(-1, 3, true).querySelector('span.columnSorting');

    expect(sortedColumn1).not.toHaveClass('ascending');
    expect(sortedColumn2).toHaveClass('ascending');
    expect(getPlugin('columnSorting').getSortConfig()).toEqual([
      { column: 3, sortOrder: 'asc' },
    ]);
  });

  it('should not reset the state of the MultiColumnSorting plugin after ColumnSorting is tried to be enabled', async() => {
    handsontable({
      colHeaders: true,
      multiColumnSorting: true,
    });

    await spec().sortByClickOnColumnHeader(2);
    await keyDown('control/meta');
    await spec().sortByClickOnColumnHeader(3);
    await updateSettings({ columnSorting: true });

    const sortedColumn1 = getCell(-1, 2, true).querySelector('span.columnSorting');
    const sortedColumn2 = getCell(-1, 3, true).querySelector('span.columnSorting');

    expect(sortedColumn1).toHaveClass('ascending');
    expect(sortedColumn2).toHaveClass('ascending');
    expect(getPlugin('multiColumnSorting').getSortConfig()).toEqual([
      { column: 2, sortOrder: 'asc' },
      { column: 3, sortOrder: 'asc' },
    ]);
  });

  it('should not reset the state of the ColumnSorting plugin after MultiColumnSorting is tried to be enabled', async() => {
    handsontable({
      colHeaders: true,
      columnSorting: true,
    });

    await spec().sortByClickOnColumnHeader(2);
    await updateSettings({ multiColumnSorting: true });

    const sortedColumn1 = getCell(-1, 2, true).querySelector('span.columnSorting');

    expect(sortedColumn1).toHaveClass('ascending');
    expect(getPlugin('columnSorting').getSortConfig()).toEqual([
      { column: 2, sortOrder: 'asc' },
    ]);
  });
});
