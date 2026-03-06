describe('`beforeFilter` hook', () => {
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
    const beforeFilter = jasmine.createSpy('beforeFilter');

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300,
      beforeFilter,
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(0, 'gt', [12]);
    plugin.addCondition(2, 'begins_with', ['b']);
    plugin.addCondition(4, 'eq', ['green']);
    plugin.filter();

    expect(beforeFilter).toHaveBeenCalledWith(
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
      [],
    );
  });

  it('should be triggered with correct the 2nd argument (`previousConditionStack`) for each filter call', async() => {
    const beforeFilter = jasmine.createSpy('beforeFilter');

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300,
      beforeFilter,
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(0, 'gt', [12]);
    plugin.filter();

    expect(beforeFilter).toHaveBeenCalledWith(
      [
        {
          column: 0,
          operation: 'conjunction',
          conditions: [{ name: 'gt', args: [12] }]
        },
      ],
      [],
    );

    beforeFilter.calls.reset();
    plugin.addCondition(2, 'begins_with', ['b']);
    plugin.filter();

    expect(beforeFilter).toHaveBeenCalledWith(
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
      ],
      [
        {
          column: 0,
          operation: 'conjunction',
          conditions: [{ name: 'gt', args: [12] }]
        },
      ],
    );

    beforeFilter.calls.reset();
    plugin.addCondition(2, 'contains', ['mike']);
    plugin.filter();

    expect(beforeFilter).toHaveBeenCalledWith(
      [
        {
          column: 0,
          operation: 'conjunction',
          conditions: [{ name: 'gt', args: [12] }]
        },
        {
          column: 2,
          operation: 'conjunction',
          conditions: [
            { name: 'begins_with', args: ['b'] },
            { name: 'contains', args: ['mike'] },
          ]
        },
      ],
      [
        {
          column: 0,
          operation: 'conjunction',
          conditions: [{ name: 'gt', args: [12] }]
        },
        {
          column: 2,
          operation: 'conjunction',
          conditions: [
            { name: 'begins_with', args: ['b'] },
          ]
        },
      ],
    );
  });

  it('should not filter values when returns `false`', async() => {
    const beforeFilter = jasmine.createSpy('beforeFilter');

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300,
      beforeFilter,
    });

    beforeFilter.and.callFake(() => false);

    const plugin = getPlugin('filters');

    plugin.addCondition(0, 'gt', [12]);
    plugin.addCondition(2, 'begins_with', ['b']);
    plugin.addCondition(4, 'eq', ['green']);
    plugin.filter();

    expect(beforeFilter).toHaveBeenCalled();
    expect(plugin.exportConditions()).toEqual([]);
    expect(getCell(-1, 0, true)).not.toHaveClass('htFiltersActive');
    expect(getCell(-1, 2, true)).not.toHaveClass('htFiltersActive');
    expect(getCell(-1, 4, true)).not.toHaveClass('htFiltersActive');
    expect(getData(0, 0, 0, 5)).toEqual([[1, 'Nannie Patel', 'Jenkinsville', '2014-01-29', 'green', 1261.6]]);
  });

  it('should filter only one column (conditional filtering)', async() => {
    const beforeFilter = jasmine.createSpy('beforeFilter');

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300,
      beforeFilter,
    });

    beforeFilter.and.callFake((conditions) => {
      return conditions.length <= 1;
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(1, 'contains', ['ad']);
    plugin.filter();

    expect(plugin.exportConditions()).toEqual([
      {
        column: 1,
        operation: 'conjunction',
        conditions: [{ name: 'contains', args: ['ad'] }]
      },
    ]);
    expect(getCell(-1, 1, true)).toHaveClass('htFiltersActive');
    expect(getDataAtCol(1)).toEqual(['Padilla Casey', 'Rocha Maddox']);

    plugin.addCondition(0, 'gt', [15]);
    plugin.filter();

    expect(plugin.exportConditions()).toEqual([
      {
        column: 1,
        operation: 'conjunction',
        conditions: [{ name: 'contains', args: ['ad'] }]
      },
    ]);
    expect(getCell(-1, 0, true)).not.toHaveClass('htFiltersActive');
    expect(getDataAtCol(1)).toEqual(['Padilla Casey', 'Rocha Maddox']);
  });
});
