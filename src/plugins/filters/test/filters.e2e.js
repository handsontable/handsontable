describe('Filters', function() {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should filter values when feature is enabled', function(done) {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);
    $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');
    $(conditionMenuRootElements().first.querySelector('tbody :nth-child(9) td')).simulate('mousedown');

    setTimeout(function () {
      // Begins with 'c'
      document.activeElement.value = 'c';
      $(document.activeElement).simulate('keyup');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(4);
      done();
    }, 200);
  });

  it('should disable filter functionality via `updateSettings`', function() {
    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });
    const plugin = hot.getPlugin('filters');

    plugin.addCondition(1, 'begins_with', ['c']);
    plugin.filter();

    hot.updateSettings({filters: false});

    dropdownMenu(1);
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel')).toBeNull();
    expect(getData().length).toEqual(39);
  });

  it('should enable filter functionality via `updateSettings`', function() {
    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: false,
      width: 500,
      height: 300
    });
    const plugin = hot.getPlugin('filters');

    hot.updateSettings({filters: true});
    plugin.addCondition(1, 'begins_with', ['c']);
    plugin.filter();

    dropdownMenu(1);
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel')).not.toBeNull();
    expect(getData().length).toEqual(4);
  });

  it('should enable filter functionality via `enablePlugin`', function() {
    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: false,
      width: 500,
      height: 300
    });
    const plugin = hot.getPlugin('filters');

    hot.getPlugin('filters').enablePlugin();
    plugin.addCondition(1, 'begins_with', ['c']);
    plugin.filter();

    dropdownMenu(1);
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel')).not.toBeNull();
    expect(getData().length).toEqual(4);
  });

  it('should disable filter functionality via `disablePlugin`', function() {
    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });
    const plugin = hot.getPlugin('filters');

    plugin.addCondition(1, 'begins_with', ['c']);
    plugin.filter();
    hot.getPlugin('filters').disablePlugin();

    dropdownMenu(1);
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel')).toBeNull();
    expect(getData().length).toEqual(39);
  });

  it('should not throw Exception after triggering `disablePlugin` when `dropdownMenu` isn\'t enabled #173', function () {
    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      width: 500,
      height: 300
    });

    expect(function () {
      hot.getPlugin('filters').disablePlugin();
    }).not.toThrow();
  });

  it('should work properly with updateSettings #32', function () {
    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      width: 500,
      height: 300
    });

    hot.getPlugin('filters').addCondition(0, 'contains', ['0']);
    hot.getPlugin('filters').filter();

    hot.updateSettings({
      fillHandle: true
    });

    expect(getData().length).toEqual(3);
  });

  it('should warn user by log at console when amount of conditions at specific column exceed the capability of ' +
    'a dropdown menu (`dropdownMenu` plugin is enabled)', function () {
    console.warn = jasmine.createSpy('warn');

    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const plugin = hot.getPlugin('filters');

    plugin.addCondition(0, 'begins_with', ['b']);
    plugin.addCondition(0, 'ends_with', ['b']);
    plugin.addCondition(0, 'contains', ['o']);
    plugin.filter();

    expect(console.warn).toHaveBeenCalled();
  });

  it('should not warn user by log at console when amount of conditions at specific column not exceed the capability of ' +
    'a dropdown menu (`dropdownMenu` plugin is enabled)', function () {
    console.warn = jasmine.createSpy('warn');

    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const plugin = hot.getPlugin('filters');

    // column with index 0
    plugin.addCondition(0, 'begins_with', ['b']);
    plugin.addCondition(0, 'ends_with', ['b']);

    // another one column
    plugin.addCondition(1, 'contains', ['o']);
    plugin.filter();

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should not warn user by log at console when amount of conditions at specific column exceed the capability of ' +
    'a dropdown menu (`dropdownMenu` plugin is disabled)', function () {
    console.warn = jasmine.createSpy('warn');

    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      width: 500,
      height: 300
    });

    const plugin = hot.getPlugin('filters');

    plugin.addCondition(0, 'begins_with', ['b']);
    plugin.addCondition(0, 'ends_with', ['b']);
    plugin.addCondition(0, 'contains', ['o']);
    plugin.filter();

    expect(console.warn).not.toHaveBeenCalled();
  });

  describe('Simple filtering (one column)', function() {
    it('should filter numeric value (greater than)', function() {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = hot.getPlugin('filters');

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

    it('should filter text value (contains)', function() {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = hot.getPlugin('filters');

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
      expect(getDataAtCol(1).join()).toBe('Ernestine Wiggins,Becky Ross,Lee Reed,Gertrude Nielsen,Peterson Bowers,Ferguson Nichols');
    });

    it('should filter date value (yesterday)', function() {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = hot.getPlugin('filters');

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

    it('should filter boolean value (true)', function() {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = hot.getPlugin('filters');

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

    describe('Cooperation with Manual Column Move plugin #32', function () {
      it('should show indicator at proper position when column order was changed - test no. 1', function () {
        const hot = handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300,
          manualColumnMove: true
        });

        const filters = hot.getPlugin('filters');
        const manualColumnMove = hot.getPlugin('manualColumnMove');

        filters.addCondition(0, 'not_empty', []);
        filters.filter();

        manualColumnMove.moveColumn(0, 3);
        hot.render();

        expect(this.$container.find('th:eq(2)').hasClass('htFiltersActive')).toEqual(true);
      });

      it('should show indicator at proper position when column order was changed - test no. 2', function () {
        const hot = handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300,
          manualColumnMove: true
        });

        const filters = hot.getPlugin('filters');
        const manualColumnMove = hot.getPlugin('manualColumnMove');

        manualColumnMove.moveColumn(0, 2);
        hot.render();

        filters.addCondition(1, 'not_empty', []);
        filters.filter();

        expect(this.$container.find('th:eq(1)').hasClass('htFiltersActive')).toEqual(true);
      });

      it('should display conditional menu with proper filter selected when column order was changed', function () {
        const hot = handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300,
          manualColumnMove: true
        });

        const filters = hot.getPlugin('filters');
        const manualColumnMove = hot.getPlugin('manualColumnMove');

        filters.addCondition(0, 'not_empty', []);
        filters.filter();

        manualColumnMove.moveColumn(0, 3);
        hot.render();

        dropdownMenu(2);

        expect($(conditionSelectRootElements().first).find('.htUISelectCaption').text()).toBe('Is not empty');
      });

      it('should display value box with proper items when column order was changed', function () {
        const hot = handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300,
          manualColumnMove: true
        });

        const filters = hot.getPlugin('filters');
        const manualColumnMove = hot.getPlugin('manualColumnMove');

        manualColumnMove.moveColumn(0, 3);
        hot.render();

        dropdownMenu(2);

        expect($(byValueBoxRootElement()).find('label:eq(0)').text()).toEqual('1');
      });
    });
  });

  describe('Advanced filtering (multiple columns)', function() {
    it('should filter values from 3 columns', function() {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = hot.getPlugin('filters');

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

    it('should filter values from multiple conditions for one column', function() {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = hot.getPlugin('filters');

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

  describe('Advanced filtering (conditions and operations combination #160)', function() {
    it('should filter values when one type of condition is used (single column)', function() {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const plugin = hot.getPlugin('filters');

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

    it('should filter values when more than one type of condition is used (single column) #1', function() {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const plugin = hot.getPlugin('filters');

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

    it('should filter values when more than one type of condition is used (single column) #2', function() {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const plugin = hot.getPlugin('filters');

      plugin.addCondition(1, 'contains', ['o']);
      plugin.addCondition(1, 'ends_with', ['e']);
      plugin.addCondition(1, 'begins_with', ['m']);
      plugin.filter();

      expect(countRows()).toBe(2);
      expect(getDataAtCell(0, 1)).toBe('Mathis Boone');
      expect(getDataAtCell(1, 1)).toBe('Mejia Osborne');
    });

    it('should filter values when one type of condition is used (multiple columns)', function() {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const plugin = hot.getPlugin('filters');

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
      '(multiple columns & two different operations)', function() {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      const plugin = hot.getPlugin('filters');

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

  describe('Undo/Redo', function() {
    it('should undo previously added filters', function() {
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

      hot.undo();

      expect(getData().length).toEqual(3);

      hot.undo();

      expect(getData().length).toEqual(36);

      hot.undo();

      expect(getData().length).toEqual(39);
    });

    it('should redo previously reverted filters', function() {
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

      hot.undo();
      hot.undo();
      hot.undo();

      expect(getData().length).toEqual(39);

      hot.redo();

      expect(getData().length).toEqual(36);

      hot.redo();

      expect(getData().length).toEqual(3);

      hot.redo();

      expect(getData().length).toEqual(2);
    });
  });

  describe('Hooks', function() {
    describe('`beforeFilter` hook', function() {
      it('should trigger `beforeFilter` hook after filtering values', function() {
        const hot = handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300
        });

        const spy = jasmine.createSpy();
        hot.addHook('beforeFilter', spy);
        const plugin = hot.getPlugin('filters');

        plugin.addCondition(0, 'gt', [12]);
        plugin.addCondition(2, 'begins_with', ['b']);
        plugin.addCondition(4, 'eq', ['green']);
        plugin.filter();

        expect(spy).toHaveBeenCalled();
        expect(spy.calls.argsFor(0)[0].length).toBe(3);
        expect(spy.calls.argsFor(0)[0][0]).toEqual({
          column: 0,
          conditions: [{name: 'gt', args: [12]}]
        });
        expect(spy.calls.argsFor(0)[0][1]).toEqual({
          column: 2,
          conditions: [{name: 'begins_with', args: ['b']}]
        });
        expect(spy.calls.argsFor(0)[0][2]).toEqual({
          column: 4,
          conditions: [{name: 'eq', args: ['green']}]
        });
      });

      it('should not filter values visually when `beforeFilter` hook returns `false`', function() {
        const hot = handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300
        });

        const spy = jasmine.createSpy();
        spy.and.callFake(function() {
          return false;
        });
        hot.addHook('beforeFilter', spy);
        const plugin = hot.getPlugin('filters');

        plugin.addCondition(0, 'gt', [12]);
        plugin.addCondition(2, 'begins_with', ['b']);
        plugin.addCondition(4, 'eq', ['green']);
        plugin.filter();

        expect(spy).toHaveBeenCalled();
        expect(hot.getData(0, 0, 0, 5)).toEqual([[1, 'Nannie Patel', 'Jenkinsville', '2014-01-29', 'green', 1261.6]]);
      });
    });

    describe('`afterFilter` hook', function() {
      it('should trigger `afterFilter` hook after filtering values', function() {
        const hot = handsontable({
          data: getDataForFilters(),
          columns: getColumnsForFilters(),
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300
        });

        const spy = jasmine.createSpy();
        hot.addHook('afterFilter', spy);
        const plugin = hot.getPlugin('filters');

        plugin.addCondition(0, 'gt', [12]);
        plugin.addCondition(2, 'begins_with', ['b']);
        plugin.addCondition(4, 'eq', ['green']);
        plugin.filter();

        expect(spy).toHaveBeenCalled();
        expect(spy.calls.argsFor(0)[0].length).toBe(3);
        expect(spy.calls.argsFor(0)[0][0]).toEqual({
          column: 0,
          conditions: [{name: 'gt', args: [12]}]
        });
        expect(spy.calls.argsFor(0)[0][1]).toEqual({
          column: 2,
          conditions: [{name: 'begins_with', args: ['b']}]
        });
        expect(spy.calls.argsFor(0)[0][2]).toEqual({
          column: 4,
          conditions: [{name: 'eq', args: ['green']}]
        });
      });
    });
  });
});
