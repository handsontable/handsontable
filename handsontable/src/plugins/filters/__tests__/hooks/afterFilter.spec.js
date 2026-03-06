describe('`afterFilter` hook', () => {
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

  it('should be triggered with correct arguments', async() => {
    const afterFilter = jasmine.createSpy('afterFilter');

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300,
      afterFilter,
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(0, 'gt', [12]);
    plugin.addCondition(2, 'begins_with', ['b']);
    plugin.addCondition(4, 'eq', ['green']);
    plugin.filter();

    expect(afterFilter).toHaveBeenCalledWith(
      [
        {
          column: 0,
          operation: 'conjunction',
          conditions: [{ name: 'gt', args: [12] }]
        },
        {
          column: 2,
          operation: 'conjunction',
          conditions: [{ name: 'begins_with', args: ['b'] }]
        },
        {
          column: 4,
          operation: 'conjunction',
          conditions: [{ name: 'eq', args: ['green'] }]
        },
      ],
    );
  });

  it('should not be triggered when `beforeFilter` blocks the filter operation', async() => {
    const afterFilter = jasmine.createSpy('afterFilter');

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300,
      beforeFilter() {
        return false;
      },
      afterFilter,
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(0, 'gt', [12]);
    plugin.addCondition(2, 'begins_with', ['b']);
    plugin.addCondition(4, 'eq', ['green']);
    plugin.filter();

    expect(afterFilter).not.toHaveBeenCalled();
    expect(plugin.exportConditions()).toEqual([]);
    expect(getData(0, 0, 0, 5)).toEqual([[1, 'Nannie Patel', 'Jenkinsville', '2014-01-29', 'green', 1261.6]]);
  });

  it('should be possible to change the default selection after filter is applied', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300,
      afterFilter() {
        selectCells([[2, 2, 5, 5]]);
      },
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(0, 'gt', [12]);
    plugin.filter();

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 2,2 from: 2,2 to: 5,5',
    ]);
  });
});
