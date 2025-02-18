describe('Filters UI Conditional component', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should display conditional filter component under dropdown menu', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);

    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel').textContent)
      .toBe('Filter by condition:');
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htUISelect')).not.toBeNull();
    expect(dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput').length).toBe(2);

    await sleep(300);

    // The filter components should be intact after some time. These expectations check whether the GhostTable
    // does not steal the components' element while recalculating column width (PR #5555).
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htFiltersMenuLabel').textContent)
      .toBe('Filter by condition:');
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuCondition .htUISelect')).not.toBeNull();
    expect(dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput').length).toBe(2);
  });

  it('should appear conditional options menu after UISelect element click', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    expect(document.querySelector('.htFiltersConditionsMenu.handsontable table')).toBeNull();

    dropdownMenu(1);
    openDropdownByConditionMenu();

    expect(document.querySelector('.htFiltersConditionsMenu.handsontable table')).not.toBeNull();
  });

  it('should have no rendered overlays visible', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);
    openDropdownByConditionMenu();

    const conditionalMenu = $(conditionMenuRootElements().first);

    expect(conditionalMenu.find('.ht_clone_top:visible').length).toBe(0);
    expect(conditionalMenu.find('.ht_clone_bottom:visible').length).toBe(0);
    expect(conditionalMenu.find('.ht_clone_inline_start:visible').length).toBe(0);
    expect(conditionalMenu.find('.ht_clone_top_inline_start_corner:visible').length).toBe(0);
    expect(conditionalMenu.find('.ht_clone_bottom_inline_start_corner:visible').length).toBe(0);
  });

  it('should appear conditional options menu in the proper place after UISelect element click', () => {
    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    hot.rootElement.style.marginTop = '1000px';

    dropdownMenu(1);
    $(dropdownMenuRootElement().querySelector('.htUISelect')).simulate('click');

    const rect = document.querySelector('.htFiltersConditionsMenu.handsontable table').getBoundingClientRect();

    // 3px comes from borders
    expect(window.scrollY + rect.top - 3).forThemes(({ classic, main }) => {
      classic.toBeAroundValue(755, 1);
      main.toBeAroundValue(715, 1);
    });
    hot.rootElement.style.marginTop = '';
  });

  it('should appear specified conditional options menu for text cell types', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);
    openDropdownByConditionMenu();

    const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
      return this.textContent;
    }).toArray();

    expect(menuItems).toEqual([
      'None',
      '',
      'Is empty',
      'Is not empty',
      '',
      'Is equal to',
      'Is not equal to',
      '',
      'Begins with',
      'Ends with',
      '',
      'Contains',
      'Does not contain',
    ]);
  });

  it('should appear specified conditional options menu for numeric cell types', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(5);
    openDropdownByConditionMenu();

    const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
      return this.textContent;
    }).toArray();

    expect(menuItems).toEqual([
      'None',
      '',
      'Is empty',
      'Is not empty',
      '',
      'Is equal to',
      'Is not equal to',
      '',
      'Greater than',
      'Greater than or equal to',
      'Less than',
      'Less than or equal to',
      'Is between',
      'Is not between'
    ]);
  });

  it('should appear specified conditional options menu for date cell types', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(3);
    openDropdownByConditionMenu();

    const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
      return this.textContent;
    }).toArray();

    expect(menuItems).toEqual([
      'None',
      '',
      'Is empty',
      'Is not empty',
      '',
      'Is equal to',
      'Is not equal to',
      '',
      'Before',
      'After',
      'Is between',
      '',
      'Tomorrow',
      'Today',
      'Yesterday',
    ]);
  });

  it('should appear general conditional options menu for mixed cell types', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300,
      cells(row, col) {
        if (col === 3 && row === 2) {
          this.type = 'text';
        }
      }
    });

    dropdownMenu(3);
    openDropdownByConditionMenu();

    const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
      return this.textContent;
    }).toArray();

    expect(menuItems).toEqual([
      'None',
      '',
      'Is empty',
      'Is not empty',
      '',
      'Is equal to',
      'Is not equal to',
      '',
      'Begins with',
      'Ends with',
      '',
      'Contains',
      'Does not contain',
    ]);
  });

  it('should appear an empty conditional options menu when the dropdown is opened using API and ' +
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
    openDropdownByConditionMenu();

    const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
      return this.textContent;
    }).toArray();

    expect(menuItems).toEqual([
      'None',
    ]);
  });

  it('should appear conditional options menu based on the selection highlight when the dropdown is opened ' +
      'using API and the table has non-contiguous selection', () => {
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
    openDropdownByConditionMenu();

    const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
      return this.textContent;
    }).toArray();

    expect(menuItems).toEqual([
      'None',
      '',
      'Is empty',
      'Is not empty',
      '',
      'Is equal to',
      'Is not equal to',
      '',
      'Before',
      'After',
      'Is between',
      '',
      'Tomorrow',
      'Today',
      'Yesterday',
    ]);
  });

  it('should not select dropdown menu item while pressing arrow up key when filter\'s input component is focused (#6506)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300,
    });

    dropdownMenu(2);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Is equal to');

    await sleep(100); // Wait for autofocus of the filter input element

    document.activeElement.value = '123';

    keyDownUp('arrowup');
    keyDownUp('arrowup');
    keyDownUp('arrowup');

    // The menu item is frozen on the lastly selected item
    expect(getPlugin('dropdownMenu').menu.getSelectedItem().key).toBe('filter_by_condition');
  });

  it('should appear specified conditional options menu depends on cell types when table has all filtered rows', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(3);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Is empty');

    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK')).simulate('click');

    dropdownMenu(3);
    openDropdownByConditionMenu();

    const menuItems = $(conditionMenuRootElements().first).find('.htCore tr').map(function() {
      return this.textContent;
    }).toArray();

    expect(menuItems).toEqual([
      'None',
      '',
      'Is empty',
      'Is not empty',
      '',
      'Is equal to',
      'Is not equal to',
      '',
      'Before',
      'After',
      'Is between',
      '',
      'Tomorrow',
      'Today',
      'Yesterday',
    ]);
  });

  it('should disappear conditional options menu after outside the table click', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);
    openDropdownByConditionMenu();

    expect(document.querySelector('.htFiltersConditionsMenu.handsontable table')).not.toBeNull();

    $(document.body).simulate('mousedown');

    expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
  });

  it('should disappear conditional options menu after click inside main menu', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);
    openDropdownByConditionMenu();

    expect(document.querySelector('.htFiltersConditionsMenu.handsontable table')).not.toBeNull();

    $(document.querySelector('.htDropdownMenu.handsontable table tr td')).simulate('mousedown');

    expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
    expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
  });

  it('should disappear conditional options menu after dropdown action click', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);
    openDropdownByConditionMenu();

    expect(document.querySelector('.htFiltersConditionsMenu.handsontable table')).not.toBeNull();

    selectDropdownMenuOption('Clear column');

    expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
  });

  it('should disappear dropdown menu after hitting ESC key in conditional component ' +
    'which show other input and focus the element', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Is equal to');

    await sleep(200);

    keyDownUp('escape');

    expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
    expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
  });

  it('should disappear dropdown menu after hitting ESC key in conditional component ' +
    'which don\'t show other input and focus is loosen #86', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    const button = hot().view._wt.wtTable.getColumnHeader(1).querySelector('.changeType');

    $(button).simulate('mousedown');

    // This sleep emulates more realistic user behavior. The `mouseup` event in all cases is not
    // triggered directly after the `mousedown` event. First of all, a user is not able to
    // click so fast. Secondly, there can be a device lag between `mousedown` and `mouseup`
    // events. This fixes an issue related to failing test, which works on browser under
    // user control but fails while automatic tests.
    await sleep(0);

    $(button).simulate('mouseup');
    $(button).simulate('click');

    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Is empty');

    await sleep(200);
    keyDownUp('escape');

    expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
    expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
  });

  it('should disappear dropdown menu after hitting ESC key, next to closing SelectUI #149', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    const button = hot().view._wt.wtTable.getColumnHeader(1).querySelector('.changeType');

    $(button).simulate('mousedown');

    // This sleep emulates more realistic user behavior. The `mouseup` event in all cases is not
    // triggered directly after the `mousedown` event. First of all, a user is not able to
    // click so fast. Secondly, there can be a device lag between `mousedown` and `mouseup`
    // events. This fixes an issue related to failing test, which works on browser under
    // user control but fails while automatic tests.
    await sleep(0);

    $(button).simulate('mouseup');
    $(button).simulate('click');

    openDropdownByConditionMenu();

    await sleep(200);

    keyDownUp('escape');
    keyDownUp('escape');

    expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
    expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
  });

  it('should focus dropdown menu after closing select component', () => {
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
    // is empty (test for condition which doesn't have input elements to provide filtered values)
    selectDropdownByConditionMenuOption('Is empty');

    expect(getPlugin('dropdownMenu').menu.hotMenu.isListening()).toBe(true);

    // is equal to (test for condition which has input elements to provide filtered values, that focusable elements
    // can cause the menu focus)
    selectDropdownByConditionMenuOption('Is equal to');

    expect(getPlugin('dropdownMenu').menu.hotMenu.isListening()).toBe(true);
  });

  it('should not blur filter component\'s input element when it is clicked', async() => {
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
    selectDropdownByConditionMenuOption('Is equal to');

    await sleep(50);

    const inputElement = dropdownMenuRootElement().querySelector('.htUIInput input');

    $(inputElement)
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click');

    expect(document.activeElement).toBe(inputElement);
  });

  it('shouldn\'t disappear dropdown menu after conditional options menu click', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Is empty');

    expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
    expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
  });

  describe('should display extra conditional component inside filters dropdownMenu properly #160', () => {
    it('should not display extra condition element at start', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
    });

    it('should show extra condition element after specific conditional options menu click', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Begins with');

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
      expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
    });

    it('should not show extra condition element after specific conditional options menu click', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('None');

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
      expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
    });

    it('should hide extra condition element after specific conditional options menu click', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      dropdownMenu(1);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is equal to');

      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('None');

      expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
      expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
    });

    it('should not show extra condition elements after changing value of cell when conditions wasn\'t set' +
      '(`conditionUpdateObserver` triggers hook)', () => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      selectCell(3, 0);
      keyDownUp('enter');
      document.activeElement.value = '99';
      keyDownUp('enter');

      dropdownMenu(1);

      expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
      expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(false);
    });

    it('should show proper condition elements after changing value of cell when condition was set' +
      '(`conditionUpdateObserver` triggers hook)', () => {
      const hot = handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: true,
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      const filters = hot.getPlugin('filters');

      filters.addCondition(1, 'gte', [10]);
      filters.filter();

      selectCell(3, 0);
      keyDownUp('enter');
      document.activeElement.value = '99';
      keyDownUp('enter');

      dropdownMenu(1);

      expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
      expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
      expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
    });
  });

  it('should not select separator from conditional menu', () => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);
    openDropdownByConditionMenu();
    // menu separator click
    $(conditionMenuRootElements().first.querySelector('tbody :nth-child(2) td'))
      .simulate('mouseenter')
      .simulate('mousedown')
      .simulate('mouseup');

    expect($(conditionSelectRootElements().first).find('.htUISelectCaption').text()).toBe('None');
  });

  it('should save state of applied filter for specified column', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    dropdownMenu(0);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Is equal to');

    await sleep(200);

    // Is equal to '5'
    document.activeElement.value = '5';
    keyUp('5');
    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

    dropdownMenu(0);

    expect(dropdownMenuRootElement().querySelector('.htUISelectCaption').textContent).toBe('Is equal to');

    let inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

    expect($(inputs[0]).is(':visible')).toBe(true);
    expect(inputs[0].value).toBe('5');
    expect($(inputs[1]).is(':visible')).toBe(false);

    dropdownMenu(3);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Is between');

    await sleep(200);

    // Is equal to '5'
    document.activeElement.value = '5';
    keyUp('5');
    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

    dropdownMenu(3);

    expect(dropdownMenuRootElement().querySelector('.htUISelectCaption').textContent).toBe('Is between');

    inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

    expect($(inputs[0]).is(':visible')).toBe(true);
    expect(inputs[0].value).toBe('5');
    expect($(inputs[1]).is(':visible')).toBe(true);
    expect(inputs[1].value).toBe('');
  });

  it('should save state of applied filter for specified column when conditions was added from API', async() => {
    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const filters = hot.getPlugin('filters');

    filters.addCondition(1, 'gte', [10]);
    filters.filter();

    dropdownMenu(1);

    await sleep(200);

    expect(dropdownMenuRootElement().querySelector('.htUISelectCaption').textContent)
      .toBe('Greater than or equal to');

    {
      const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

      expect($(inputs[0]).is(':visible')).toBe(true);
      expect(inputs[0].value).toBe('10');
      expect($(inputs[1]).is(':visible')).toBe(false);

      filters.clearConditions(1);
      filters.filter();
    }

    dropdownMenu(1);

    await sleep(200);

    expect(dropdownMenuRootElement().querySelector('.htUISelectCaption').textContent).toBe('None');

    {
      const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

      expect($(inputs[0]).is(':visible')).toBe(false);
      expect($(inputs[1]).is(':visible')).toBe(false);
    }
  });

  it('should work properly when user added condition with too many arguments #179', async() => {
    const spy = spyOn(window, 'onerror');
    const hot = handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const plugin = hot.getPlugin('filters');
    const th = hot.view._wt.wtTable.getColumnHeader(1);
    const filterButton = $(th).find('button');

    plugin.addCondition(1, 'begins_with', ['a', 'b', 'c', 'd']);

    $(filterButton).simulate('click');

    expect(spy).not.toHaveBeenCalled();
  });
});
