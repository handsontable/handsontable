describe('Filters UI cooperation with UndoRedo', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should undo previously added filters', () => {
    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });
    const plugin = hot.getPlugin('filters');

    plugin.addCondition(0, 'gt', [3]);
    plugin.filter();
    plugin.addCondition(2, 'begins_with', ['b']);
    plugin.filter();
    plugin.addCondition(4, 'eq', ['green']);
    plugin.filter();

    expect(getData().length).toEqual(2);

    getPlugin('undoRedo').undo();

    expect(getData().length).toEqual(3);

    getPlugin('undoRedo').undo();

    expect(getData().length).toEqual(36);

    getPlugin('undoRedo').undo();

    expect(getData().length).toEqual(39);
  });

  it('should redo previously reverted filters', () => {
    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });
    const plugin = hot.getPlugin('filters');

    plugin.addCondition(0, 'gt', [3]);
    plugin.filter();
    plugin.addCondition(2, 'begins_with', ['b']);
    plugin.filter();
    plugin.addCondition(4, 'eq', ['green']);
    plugin.filter();

    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();
    getPlugin('undoRedo').undo();

    expect(getData().length).toEqual(39);

    getPlugin('undoRedo').redo();

    expect(getData().length).toEqual(36);

    getPlugin('undoRedo').redo();

    expect(getData().length).toEqual(3);

    getPlugin('undoRedo').redo();

    expect(getData().length).toEqual(2);
  });

  it('should undo multiple steps of filtering performed with the Filters\' UI', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Begins with');

    await sleep(20);
    document.activeElement.value = 'R';
    keyUp('R');

    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

    expect(getData().length).toEqual(2);

    setDataAtCell(0, 1, `${getDataAtCell(0, 1)}!`);
    setDataAtCell(1, 1, `${getDataAtCell(1, 1)}!`);

    expect(getDataAtCell(0, 1).includes('!')).toBe(true);
    expect(getDataAtCell(1, 1).includes('!')).toBe(true);

    dropdownMenu(1);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Begins with');

    await sleep(20);
    document.activeElement.value = '';
    keyUp('Backspace');

    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

    expect(getData().length).toEqual(39);
    expect(getDataAtCell(0, 1).includes('!')).toBe(false);
    expect(getDataAtCell(1, 1).includes('!')).toBe(false);
    expect(getDataAtCell(4, 1).includes('!')).toBe(true);
    expect(getDataAtCell(33, 1).includes('!')).toBe(true);

    getPlugin('undoRedo').undo();

    expect(getData().length).toEqual(2);
    expect(getDataAtCell(0, 1).includes('!')).toBe(true);
    expect(getDataAtCell(1, 1).includes('!')).toBe(true);

    getPlugin('undoRedo').undo();

    expect(getDataAtCell(0, 1).includes('!')).toBe(true);
    expect(getDataAtCell(1, 1).includes('!')).toBe(false);

    getPlugin('undoRedo').undo();

    expect(getDataAtCell(0, 1).includes('!')).toBe(false);
    expect(getDataAtCell(1, 1).includes('!')).toBe(false);

    getPlugin('undoRedo').undo();

    expect(getData().length).toEqual(39);
    expect(getDataAtCell(0, 1).includes('!')).toBe(false);
    expect(getDataAtCell(1, 1).includes('!')).toBe(false);
    expect(getDataAtCell(4, 1).includes('!')).toBe(false);
    expect(getDataAtCell(33, 1).includes('!')).toBe(false);
  });

  it('should undo and redo previously added filters with changed data between conditions (#dev-2079)', () => {
    const hot = handsontable({
      data: getDataForFilters().splice(0, 5),
      columns: getColumnsForFilters().splice(0, 3),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });
    const undoPlugin = getPlugin('undoRedo');
    const filtersPlugin = hot.getPlugin('filters');

    filtersPlugin.addCondition(2, 'by_value', [['Gardiner']]);
    filtersPlugin.filter();

    setDataAtCell(0, 2, null);

    filtersPlugin.removeConditions(2);
    filtersPlugin.filter();

    expect(getDataAtCol(2)).toEqual(['Jenkinsville', null, 'Saranap', 'Cascades', 'Soham']);

    undoPlugin.undo();

    expect(getDataAtCol(2)).toEqual([null]);

    undoPlugin.undo();

    expect(getDataAtCol(2)).toEqual(['Gardiner']);

    undoPlugin.undo();

    expect(getDataAtCol(2)).toEqual(['Jenkinsville', 'Gardiner', 'Saranap', 'Cascades', 'Soham']);

    undoPlugin.redo();

    expect(getDataAtCol(2)).toEqual(['Gardiner']);

    undoPlugin.redo();

    expect(getDataAtCol(2)).toEqual([null]);

    undoPlugin.redo();

    expect(getDataAtCol(2)).toEqual(['Jenkinsville', null, 'Saranap', 'Cascades', 'Soham']);
  });
});
