describe('Filters UI ActionBar component', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should appear under dropdown menu', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);

    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuActionBar .htUIButtonOK input').value)
      .toBe('OK');
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuActionBar .htUIButtonCancel input').value)
      .toBe('Cancel');

    await sleep(300);

    // The filter components should be intact after some time. These expectations check whether the GhostTable
    // does not steal the components' element while recalculating column width (PR #5555).
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuActionBar .htUIButtonOK input').value)
      .toBe('OK');
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuActionBar .htUIButtonCancel input').value)
      .toBe('Cancel');
  });

  it('should close the menu after clicking the "OK" button when the dropdown is opened using API and ' +
      'the table has no selection', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    getPlugin('dropdownMenu').open({
      top: 100,
      left: 100,
    });

    expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);

    mouseClick(dropdownMenuRootElement().querySelector('.htFiltersMenuActionBar .htUIButtonOK input'));

    expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
  });

  it('should close the menu after clicking the "OK" button when the dropdown is opened using API and ' +
      'the table has non-contiguous selection', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    // the highlight cell points to the 6, 3 (the selected column is 3)
    selectCells([
      [1, 0, 2, 1],
      [4, 2, 4, 4],
      [6, 3, 6, 1],
    ]);
    getPlugin('dropdownMenu').open({
      top: 100,
      left: 100,
    });

    expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);

    mouseClick(dropdownMenuRootElement().querySelector('.htFiltersMenuActionBar .htUIButtonOK input'));

    expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
  });
});
