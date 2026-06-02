describe('Filters', () => {
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

  it('should filter values when feature is enabled', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(1);
    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('Begins with');
    await waitForNextAnimationFrames(13);

    // Begins with 'c'
    document.activeElement.value = 'c';

    await keyUp('c');

    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

    expect(getData().length).toEqual(4);
  });

  it('should disable filter functionality via `updateSettings`', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });
    const plugin = getPlugin('filters');

    plugin.addCondition(1, 'begins_with', ['c']);
    plugin.filter();

    await updateSettings({ filters: false });
    await dropdownMenu(1);

    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel')).toBeNull();
    expect(getData().length).toEqual(39);
  });

  it('should enable filter functionality via `updateSettings`', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: false,
      width: 500,
      height: 300
    });
    const plugin = getPlugin('filters');

    await updateSettings({ filters: true });

    plugin.addCondition(1, 'begins_with', ['c']);
    plugin.filter();

    await dropdownMenu(1);

    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel')).not.toBeNull();
    expect(getData().length).toEqual(4);
  });

  it('should enable filter functionality via `enablePlugin`', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: false,
      width: 500,
      height: 300
    });
    const plugin = getPlugin('filters');

    getPlugin('filters').enablePlugin();
    plugin.addCondition(1, 'begins_with', ['c']);
    plugin.filter();

    await dropdownMenu(1);

    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel')).not.toBeNull();
    expect(getData().length).toEqual(4);
  });

  it('should disable filter functionality via `disablePlugin`', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });
    const plugin = getPlugin('filters');

    plugin.addCondition(1, 'begins_with', ['c']);
    plugin.filter();
    getPlugin('filters').disablePlugin();

    await dropdownMenu(1);

    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel')).toBeNull();
    expect(getData().length).toEqual(39);
  });

  it('should not throw Exception after triggering `disablePlugin` when `dropdownMenu` isn\'t enabled #173', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      width: 500,
      height: 300
    });

    expect(() => {
      getPlugin('filters').disablePlugin();
    }).not.toThrow();
  });

  it('should work properly with updateSettings #32', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      width: 500,
      height: 300
    });

    getPlugin('filters').addCondition(0, 'contains', ['0']);
    getPlugin('filters').filter();

    await updateSettings({
      fillHandle: true
    });

    expect(getData().length).toEqual(3);
  });

  it('should return proper response on the `toVisualRow` call when sorted filtered values #5890', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      columnSorting: true
    });

    const filtersPlugin = getPlugin('filters');
    const columnSortingPlugin = getPlugin('columnSorting');

    filtersPlugin.addCondition(0, 'gt', [1]);
    filtersPlugin.filter();

    columnSortingPlugin.sort({
      column: 0,
      sortOrder: 'desc'
    });

    expect(toVisualRow(0)).toEqual(null);
    expect(toVisualRow(1)).toBe(37);
    expect(toVisualRow(38)).toBe(0);
  });

  it('should warn user by log at console when amount of conditions at specific column exceed the capability of ' +
    'a dropdown menu (`dropdownMenu` plugin is enabled)', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: createSpreadsheetData(10, 5),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(0, 'begins_with', ['b']);
    plugin.addCondition(0, 'ends_with', ['b']);
    plugin.addCondition(0, 'contains', ['o']);
    plugin.filter();

    expect(warnSpy.calls.mostRecent().args).toEqual(['The filter conditions have been applied properly, ' +
      'but couldn’t be displayed visually. The dropdown menu supports at most 2 regular conditions and 1 ' +
      '\'filter by value\' condition per column, but more were provided. ' +
      'For more details see the documentation.']);

    plugin.addCondition(0, 'contains', ['o']);
    plugin.filter();

    expect(warnSpy.calls.mostRecent().args).toEqual(['The filter conditions have been applied properly, ' +
      'but couldn’t be displayed visually. The dropdown menu supports at most 2 regular conditions and 1 ' +
      '\'filter by value\' condition per column, but more were provided. ' +
      'For more details see the documentation.']);
    expect(warnSpy.calls.count()).toBe(2);
  });

  it('should not warn user by log at console when amount of conditions at specific column not exceed the capability of ' +
    'a dropdown menu (`dropdownMenu` plugin is enabled)', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: createSpreadsheetData(10, 5),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const plugin = getPlugin('filters');

    // column with index 0
    plugin.addCondition(0, 'begins_with', ['b']);
    plugin.addCondition(0, 'ends_with', ['b']);

    // another one column
    plugin.addCondition(1, 'contains', ['o']);
    plugin.filter();

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should not warn user by log at console when amount of conditions at specific column exceed the capability of ' +
    'a dropdown menu (`dropdownMenu` plugin is disabled)', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: createSpreadsheetData(10, 5),
      filters: true,
      width: 500,
      height: 300
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(0, 'begins_with', ['b']);
    plugin.addCondition(0, 'ends_with', ['b']);
    plugin.addCondition(0, 'contains', ['o']);
    plugin.filter();

    expect(warnSpy).not.toHaveBeenCalled();
  });

  describe('Simple filtering (one column)', () => {
    it('should filter numeric value (greater than)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(0, 'gte', [23]);
      plugin.filter();

      expect(getData().length).toEqual(17);
      expect(getData()[0][0]).toBe(23);
      expect(getData()[0][1]).toBe('Mejia Osborne');
      expect(getData()[0][2]).toBe('Fowlerville');
      expect(getData()[0][3]).toBe('2014-05-24');
      expect(getData()[0][4]).toBe('blue');
      expect(getData()[0][5]).toBe(1852.34);
      expect(getDataAtCol(0).join()).toBe('23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39');
    });

    it('should filter text value (contains)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'not_contains', ['a']);
      plugin.filter();

      expect(getData().length).toEqual(6);
      expect(getData()[0][0]).toBe(6);
      expect(getData()[0][1]).toBe('Ernestine Wiggins');
      expect(getData()[0][2]).toBe('Needmore');
      expect(getData()[0][3]).toBe('2014-03-13');
      expect(getData()[0][4]).toBe('brown');
      expect(getData()[0][5]).toBe(1800.03);
      expect(getData()[0][6]).toBe(true);
      expect(getDataAtCol(1).join())
        .toBe('Ernestine Wiggins,Becky Ross,Lee Reed,Gertrude Nielsen,Peterson Bowers,Ferguson Nichols');
    });

    it('should filter date value (yesterday)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(3, 'between', ['2015-05-10', '2015-07-10']);
      plugin.filter();

      expect(getData().length).toEqual(1);
      expect(getData()[0][0]).toBe(17);
      expect(getData()[0][1]).toBe('Bridges Sawyer');
      expect(getData()[0][2]).toBe('Bowie');
      expect(getData()[0][3]).toBe('2015-06-28');
      expect(getData()[0][4]).toBe('green');
      expect(getData()[0][5]).toBe(1792.36);
      expect(getData()[0][6]).toBe(false);
    });

    it('should filter boolean value (true)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(6, 'eq', ['false']);
      plugin.filter();

      expect(getData().length).toEqual(21);
      expect(getData()[4][0]).toBe(10);
      expect(getData()[4][1]).toBe('Padilla Casey');
      expect(getData()[4][2]).toBe('Garberville');
      expect(getData()[4][3]).toBe('2015-08-16');
      expect(getData()[4][4]).toBe('blue');
      expect(getData()[4][5]).toBe(3472.56);
      expect(getData()[4][6]).toBe(false);
      expect(getDataAtCol(6).join()).toBe('false,false,false,false,false,false,false,false,false,false,false,false,' +
        'false,false,false,false,false,false,false,false,false');
    });

    describe('Cooperation with Manual Column Move plugin #32', () => {
      it('should show indicator at proper position when column order was changed - test no. 1', async() => {
        handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300,
          manualColumnMove: true
        });

        const filters = getPlugin('filters');
        const manualColumnMove = getPlugin('manualColumnMove');

        filters.addCondition(0, 'not_empty', []);
        filters.filter();

        manualColumnMove.moveColumn(0, 3);
        await render();

        expect(spec().$container.find('th:eq(3)').hasClass('htFiltersActive')).toEqual(true);
      });

      it('should show indicator at proper position when column order was changed - test no. 2', async() => {
        handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300,
          manualColumnMove: true
        });

        const filters = getPlugin('filters');
        const manualColumnMove = getPlugin('manualColumnMove');

        manualColumnMove.moveColumn(0, 1);
        await render();

        filters.addCondition(1, 'not_empty', []);
        filters.filter();

        expect(spec().$container.find('th:eq(1)').hasClass('htFiltersActive')).toEqual(true);
      });

      it('should display conditional menu with proper filter selected when column order was changed', async() => {
        handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300,
          manualColumnMove: true
        });

        const filters = getPlugin('filters');
        const manualColumnMove = getPlugin('manualColumnMove');

        filters.addCondition(0, 'not_empty', []);
        filters.filter();

        manualColumnMove.moveColumn(0, 2);

        await render();
        await dropdownMenu(2);

        expect($(conditionSelectRootElements().first).find('.htUISelectCaption').text()).toBe('Is not empty');
      });

      it('should display value box with proper items when column order was changed', async() => {
        handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300,
          manualColumnMove: true
        });

        const manualColumnMove = getPlugin('manualColumnMove');

        manualColumnMove.moveColumn(0, 2);

        await render();
        await dropdownMenu(2);

        expect($(byValueBoxRootElement()).find('label:eq(0)').text()).toEqual('1');
      });
    });
  });

  describe('Advanced filtering (multiple columns)', () => {
    it('should filter values from 3 columns', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(0, 'gt', [12]);
      plugin.addCondition(2, 'begins_with', ['b']);
      plugin.addCondition(4, 'eq', ['green']);
      plugin.filter();

      expect(getData().length).toEqual(2);
      expect(getData()[0][0]).toBe(17);
      expect(getData()[0][1]).toBe('Bridges Sawyer');
      expect(getData()[0][2]).toBe('Bowie');
      expect(getData()[0][3]).toBe('2015-06-28');
      expect(getData()[0][4]).toBe('green');
      expect(getData()[0][5]).toBe(1792.36);
      expect(getData()[0][6]).toBe(false);
      expect(getData()[1][0]).toBe(24);
      expect(getData()[1][1]).toBe('Greta Patterson');
      expect(getData()[1][2]).toBe('Bartonsville');
      expect(getData()[1][3]).toBe(moment().add(-2, 'days').format(FILTERS_DATE_FORMAT));
      expect(getData()[1][4]).toBe('green');
      expect(getData()[1][5]).toBe(2437.58);
      expect(getData()[1][6]).toBe(false);
    });

    it('should filter values from multiple conditions for one column', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(0, 'gt', [12]);
      plugin.addCondition(2, 'begins_with', ['b']);
      plugin.addCondition(0, 'between', [1, 15]);
      plugin.filter();

      expect(getData().length).toEqual(1);
      expect(getData()[0][0]).toBe(14);
      expect(getData()[0][1]).toBe('Helga Mathis');
      expect(getData()[0][2]).toBe('Brownsville');
      expect(getData()[0][3]).toBe('2015-03-22');
      expect(getData()[0][4]).toBe('brown');
      expect(getData()[0][5]).toBe(3917.34);
      expect(getData()[0][6]).toBe(true);
    });
  });

  describe('Advanced filtering (conditions and operations combination #160)', () => {
    it('should filter values when one type of condition is used (single column)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'contains', ['o']);
      plugin.addCondition(1, 'contains', ['e']);
      plugin.addCondition(1, 'contains', ['m']);
      plugin.filter();

      expect(countRows()).toBe(5);

      expect(getDataAtCell(0, 1)).toBe('Mathis Boone');
      expect(getDataAtCell(1, 1)).toBe('Chelsea Solomon');
      expect(getDataAtCell(2, 1)).toBe('Patsy Mooney');
      expect(getDataAtCell(3, 1)).toBe('Mejia Osborne');
      expect(getDataAtCell(4, 1)).toBe('Long Mathews');
    });

    it('should filter values when more than one type of condition is used (single column) #1', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const plugin = getPlugin('filters');

      // Mathis Boone, Mcintyre Clarke, Mejia Osborne, Molly Walton, Milagros Parsons
      plugin.addCondition(1, 'begins_with', ['m']);
      plugin.filter();
      expect(countRows()).toBe(5);

      // Mathis Boone, Mcintyre Clarke, Mejia Osborne
      plugin.addCondition(1, 'ends_with', ['e']);
      plugin.filter();
      expect(countRows()).toBe(3);

      // Mathis Boone, Mejia Osborne
      plugin.addCondition(1, 'contains', ['o']);
      plugin.filter();

      expect(countRows()).toBe(2);
      expect(getDataAtCell(0, 1)).toBe('Mathis Boone');
      expect(getDataAtCell(1, 1)).toBe('Mejia Osborne');
    });

    it('should filter values when more than one type of condition is used (single column) #2', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'contains', ['o']);
      plugin.addCondition(1, 'ends_with', ['e']);
      plugin.addCondition(1, 'begins_with', ['m']);
      plugin.filter();

      expect(countRows()).toBe(2);
      expect(getDataAtCell(0, 1)).toBe('Mathis Boone');
      expect(getDataAtCell(1, 1)).toBe('Mejia Osborne');
    });

    it('should filter values when one type of condition is used (multiple columns)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'contains', ['o']);
      plugin.addCondition(1, 'contains', ['e']);
      plugin.addCondition(1, 'contains', ['m']);

      plugin.addCondition(2, 'contains', ['s']);
      plugin.addCondition(2, 'contains', ['p']);
      plugin.filter();

      expect(countRows()).toBe(2);
      expect(getDataAtCell(0, 1)).toBe('Mathis Boone');
      expect(getDataAtCell(0, 2)).toBe('Saranap');

      expect(getDataAtCell(1, 1)).toBe('Long Mathews');
      expect(getDataAtCell(1, 2)).toBe('Masthope');
    });

    it('should filter values when more than one type of condition is used ' +
      '(multiple columns & two different operations)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'contains', ['o'], 'disjunction');
      plugin.addCondition(1, 'contains', ['e'], 'disjunction');
      plugin.addCondition(1, 'contains', ['m'], 'disjunction');

      plugin.addCondition(2, 'contains', ['s'], 'conjunction');
      plugin.addCondition(2, 'not_contains', ['r'], 'conjunction');
      plugin.addCondition(2, 'not_contains', ['a'], 'conjunction');
      plugin.filter();

      expect(countRows()).toBe(4);
      expect(getDataAtCell(0, 1)).toBe('Nannie Patel');
      expect(getDataAtCell(0, 2)).toBe('Jenkinsville');

      expect(getDataAtCell(1, 1)).toBe('Freda Robinson');
      expect(getDataAtCell(1, 2)).toBe('Weeksville');

      expect(getDataAtCell(2, 1)).toBe('Peterson Bowers');
      expect(getDataAtCell(2, 2)).toBe('Nelson');

      expect(getDataAtCell(3, 1)).toBe('Pearson Douglas');
      expect(getDataAtCell(3, 2)).toBe('Esmont');
    });
  });

  it('should add minSpareRows properly when the filters plugin is enabled #3937', async() => {
    handsontable({
      minSpareRows: 1,
      filters: true
    });

    await loadData(createSpreadsheetData(3, 3));

    expect(getData()).toEqual([
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
      ['A3', 'B3', 'C3'],
      [null, null, null],
    ]);
  });

  it('should work also when the `TrimRows` plugin is enabled #3937', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      filters: true,
      trimRows: [1]
    });

    expect(getData()).toEqual([
      ['A1', 'B1', 'C1', 'D1', 'E1'],
      ['A3', 'B3', 'C3', 'D3', 'E3'],
      ['A4', 'B4', 'C4', 'D4', 'E4'],
      ['A5', 'B5', 'C5', 'D5', 'E5'],
    ]);
  });

  describe('cooperation with alter actions', () => {
    it('should filter proper column after removing column right before the already filtered one', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        data: createSpreadsheetData(3, 3),
        filters: true,
      });

      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'contains', ['b']);
      plugin.filter();

      await alter('remove_col', 0);
      await dropdownMenu(0);

      expect(getData()).toEqual([
        ['B1', 'C1'],
        ['B2', 'C2'],
        ['B3', 'C3'],
      ]);
      expect(spec().$container.find('th:eq(0)').hasClass('htFiltersActive')).toEqual(true);
      expect(spec().$container.find('th:eq(1)').hasClass('htFiltersActive')).toEqual(false);
      expect(plugin.components.get('filter_by_condition').getState()).toEqual({
        args: ['b'],
        command: {
          inputsCount: 1,
          key: 'contains',
          name: 'Contains',
          showOperators: true,
        },
      });
      expect(plugin.components.get('filter_operators').getState()).toBe('conjunction');
      expect(plugin.components.get('filter_by_condition2').getState()).toEqual({
        args: [],
        command: {
          inputsCount: 0,
          key: 'none',
          name: 'None',
          showOperators: false,
        },
      });
      expect(plugin.components.get('filter_by_value').getState()).toEqual({
        args: [['B1', 'B2', 'B3']],
        command: {
          key: 'none',
        },
        itemsSnapshot: [
          { checked: true, value: 'B1', visualValue: 'B1' },
          { checked: true, value: 'B2', visualValue: 'B2' },
          { checked: true, value: 'B3', visualValue: 'B3' },
        ],
      });
    });

    it('should filter proper column after inserting column right before the already filtered one', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        data: createSpreadsheetData(3, 3),
        filters: true,
      });

      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'contains', ['b']);
      plugin.filter();

      await alter('insert_col_start', 1);
      await dropdownMenu(2);

      expect(getData()).toEqual([
        ['A1', null, 'B1', 'C1'],
        ['A2', null, 'B2', 'C2'],
        ['A3', null, 'B3', 'C3'],
      ]);
      expect(spec().$container.find('th:eq(1)').hasClass('htFiltersActive')).toEqual(false);
      expect(spec().$container.find('th:eq(2)').hasClass('htFiltersActive')).toEqual(true);
      expect(plugin.components.get('filter_by_condition').getState()).toEqual({
        args: ['b'],
        command: {
          inputsCount: 1,
          key: 'contains',
          name: 'Contains',
          showOperators: true,
        },
      });
      expect(plugin.components.get('filter_operators').getState()).toBe('conjunction');
      expect(plugin.components.get('filter_by_condition2').getState()).toEqual({
        args: [],
        command: {
          inputsCount: 0,
          key: 'none',
          name: 'None',
          showOperators: false,
        },
      });
      expect(plugin.components.get('filter_by_value').getState()).toEqual({
        args: [['B1', 'B2', 'B3']],
        command: {
          key: 'none',
        },
        itemsSnapshot: [
          { checked: true, value: 'B1', visualValue: 'B1' },
          { checked: true, value: 'B2', visualValue: 'B2' },
          { checked: true, value: 'B3', visualValue: 'B3' },
        ],
      });
    });
  });

  describe('Visual/Physical column index conversion (issue #11832)', () => {
    it('should correctly update filter conditions after moving columns and adding data', async() => {
      handsontable({
        data: [
          ['Mar 27, 2023', 'Product A', 'Cycling Cap'],
          ['Oct 15, 2023', 'Product B', 'HL Mountain Shirt']
        ],
        colHeaders: ['Sold on', 'Product', 'Model'],
        dropdownMenu: true,
        manualColumnMove: true,
        filters: true,
        width: 500,
        height: 300
      });

      const plugin = getPlugin('filters');
      const manualColumnMove = getPlugin('manualColumnMove');

      // Move first column (Sold on) to third position
      manualColumnMove.moveColumn(0, 2);
      await render();

      // Add condition to the moved column (now at physical index 0, but visual index 2)
      plugin.addCondition(2, 'by_value', [['Mar 27, 2023', 'Oct 15, 2023']]);
      plugin.filter();

      // Add new row and set data
      await alter('insert_row_below', 1);
      // Set data at the moved column (physical index 0, visual index 2)
      await setDataAtCell(2, 2, 'Mar 27, 2023');

      await sleep(100);

      // Verify that the filter still has conditions for the correct column
      const conditions = plugin.conditionCollection.getConditions(0); // Physical column 0

      expect(conditions.length).toBeGreaterThan(0);
      expect(conditions[0].name).toBe('by_value');
    });

    it('should use physical column index when checking and updating conditions in #onAfterChange', async() => {
      handsontable({
        data: [
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2']
        ],
        colHeaders: true,
        manualColumnMove: true,
        filters: true
      });

      const plugin = getPlugin('filters');
      const manualColumnMove = getPlugin('manualColumnMove');

      // Move column 0 to position 2
      manualColumnMove.moveColumn(0, 2);
      await render();

      // Add condition to physical column 0 (which is now at visual position 2)
      // Physical column 0 corresponds to the original first column
      const physicalColumn = 0;

      plugin.addCondition(toVisualColumn(physicalColumn), 'by_value', [['A1', 'A2']]);
      plugin.filter();

      // Spy on updateValueComponentCondition to verify it's called with physical index
      spyOn(plugin, 'updateValueComponentCondition').and.callThrough();

      // Change data using the property name (which will be converted to column index)
      // The first column in the original data has index 0
      await setDataAtCell(0, toVisualColumn(physicalColumn), 'A1-modified');

      // Verify that updateValueComponentCondition was called with the physical column index
      expect(plugin.updateValueComponentCondition).toHaveBeenCalledWith(physicalColumn);
    });

    it('should convert visual to physical index in updateValueComponentCondition', async() => {
      handsontable({
        data: [
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2']
        ],
        colHeaders: true,
        manualColumnMove: true,
        filters: true
      });

      const plugin = getPlugin('filters');
      const manualColumnMove = getPlugin('manualColumnMove');

      // Move column 0 to position 2
      manualColumnMove.moveColumn(0, 2);
      await render();

      const physicalColumn = 0;
      const visualColumn = toVisualColumn(physicalColumn);

      plugin.addCondition(visualColumn, 'by_value', [['A1', 'A2']]);
      plugin.filter();

      // Spy on hot.getDataAtCol to verify it's called with visual index
      const hotInstance = plugin.hot;

      spyOn(hotInstance, 'getDataAtCol').and.callThrough();
      spyOn(hotInstance, 'toVisualColumn').and.callThrough();

      // Call updateValueComponentCondition with physical index
      plugin.updateValueComponentCondition(physicalColumn);

      // Verify that toVisualColumn was called to convert physical to visual
      expect(hotInstance.toVisualColumn).toHaveBeenCalledWith(physicalColumn);
      // Verify that getDataAtCol was called with the visual index
      expect(hotInstance.getDataAtCol).toHaveBeenCalledWith(visualColumn);
    });
  });

  describe('Editing a cell in an earlier filtered column (issue #8874)', () => {
    it('should keep dependent column by_value selection in cached state after editing earlier filtered column',
      async() => {
        handsontable({
          data: [
            { id: 1, country: 'Germany', company: 'BMW' },
            { id: 2, country: 'Germany', company: 'Mercedes' },
            { id: 3, country: 'Italy', company: 'Fiat' },
            { id: 4, country: 'France', company: 'Renault' },
          ],
          columns: [
            { data: 'id', type: 'numeric' },
            { data: 'country' },
            { data: 'company' },
          ],
          colHeaders: ['ID', 'Country', 'Company'],
          dropdownMenu: true,
          filters: true,
        });

        const filters = getPlugin('filters');

        filters.addCondition(1, 'by_value', [['Germany', 'France']]);
        filters.filter();
        filters.addCondition(2, 'by_value', [['Mercedes', 'Renault']]);
        filters.filter();

        await setDataAtCell(0, 1, 'France');

        const valueComponentState = filters.components.get('filter_by_value').state.getValueAtIndex(2);

        expect(valueComponentState.args[0]).toEqual(['Mercedes', 'Renault']);
      });
  });
});
