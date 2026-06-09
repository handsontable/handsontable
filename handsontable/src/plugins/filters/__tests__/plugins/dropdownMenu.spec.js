describe('Filters UI cooperation with DropdownMenu', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  /**
   * Sum horizontal box-model contributions (padding, border, margin) that subtract from
   * content width as we walk up from a child element to (but not including) an ancestor TD.
   *
   * @param {HTMLElement} child The element whose width is being measured.
   * @param {HTMLElement} td The ancestor TD whose content width bounds the child.
   * @returns {number} Sum of paddings, borders, and margins that reduce available width.
   */
  function sumHorizontalBoxDelta(child, td) {
    let delta = 0;
    const win = child.ownerDocument.defaultView;
    // Contribution from the child itself (its own borders + paddings).
    const childStyle = win.getComputedStyle(child);

    delta += parseFloat(childStyle.borderLeftWidth) || 0;
    delta += parseFloat(childStyle.borderRightWidth) || 0;
    delta += parseFloat(childStyle.paddingLeft) || 0;
    delta += parseFloat(childStyle.paddingRight) || 0;
    // Walk up ancestors until we reach the TD. For each intermediate element add
    // its own margins + borders + paddings. For the TD add only its paddings.
    let node = child.parentElement;

    while (node && node !== td) {
      const style = win.getComputedStyle(node);

      delta += parseFloat(style.marginLeft) || 0;
      delta += parseFloat(style.marginRight) || 0;
      delta += parseFloat(style.borderLeftWidth) || 0;
      delta += parseFloat(style.borderRightWidth) || 0;
      delta += parseFloat(style.paddingLeft) || 0;
      delta += parseFloat(style.paddingRight) || 0;
      node = node.parentElement;
    }
    if (node === td) {
      const tdStyle = win.getComputedStyle(td);

      delta += parseFloat(tdStyle.paddingLeft) || 0;
      delta += parseFloat(tdStyle.paddingRight) || 0;
    }

    return delta;
  }

  it('should scale text input showed after condition selection (pixel perfect)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      colHeaders: true,
      dropdownMenu: {
        items: {
          custom: {
            name: 'This is very long text which should expand the drop-down menu...'
          },
          filter_by_condition: {},
          filter_operators: {},
          filter_by_condition2: {},
          filter_by_value: {}
        }
      },
      filters: true
    });

    await dropdownMenu(1);

    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('Begins with');

    const widthOfMenu = $(dropdownMenuRootElement()).find('table.htCore').width();
    const inputEl = $(dropdownMenuRootElement()).find('input')[0];
    const widthOfInput = $(inputEl).width();
    const tdEl = $(inputEl).closest('td')[0];
    const parentsPaddings = sumHorizontalBoxDelta(inputEl, tdEl);

    expect(widthOfInput).toBeAroundValue(widthOfMenu - parentsPaddings, 1);
  });

  it('should scale a condition select (pixel perfect)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      colHeaders: true,
      dropdownMenu: {
        items: {
          custom: {
            name: 'This is very long text which should expand the drop-down menu...'
          },
          filter_by_condition: {},
          filter_operators: {},
          filter_by_condition2: {},
          filter_by_value: {}
        }
      },
      filters: true
    });

    await dropdownMenu(1);

    const widthOfMenu = $(dropdownMenuRootElement()).find('table.htCore').width();
    const selectEl = $(conditionSelectRootElements().first)[0];
    const widthOfSelect = $(selectEl).width();
    const tdEl = $(selectEl).closest('td')[0];
    const parentsPaddings = sumHorizontalBoxDelta(selectEl, tdEl);

    expect(widthOfSelect).toBeAroundValue(widthOfMenu - parentsPaddings, 1);
  });

  it('should scale search input of the value box (pixel perfect)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      colHeaders: true,
      dropdownMenu: {
        items: {
          custom: {
            name: 'This is very long text which should expand the drop-down menu...'
          },
          filter_by_condition: {},
          filter_operators: {},
          filter_by_condition2: {},
          filter_by_value: {}
        }
      },
      filters: true
    });

    await dropdownMenu(1);

    const widthOfMenu = $(dropdownMenuRootElement()).find('table.htCore').width();
    const inputEl = $(dropdownMenuRootElement()).find('.htUIMultipleSelectSearch input')[0];
    const widthOfInput = $(inputEl).width();
    const tdEl = $(inputEl).closest('td')[0];
    const parentsPaddings = sumHorizontalBoxDelta(inputEl, tdEl);

    expect(widthOfInput).toBeAroundValue(widthOfMenu - parentsPaddings, 1);
  });

  it('should scale the value box element (pixel perfect)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      colHeaders: true,
      dropdownMenu: {
        items: {
          custom: {
            name: 'This is very long text which should expand the drop-down menu...'
          },
          filter_by_condition: {},
          filter_operators: {},
          filter_by_condition2: {},
          filter_by_value: {}
        }
      },
      filters: true
    });

    await dropdownMenu(1);

    await openDropdownByConditionMenu();
    $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")')
      .simulate('mousedown')
      .simulate('mouseup');

    const widthOfMenu = $(dropdownMenuRootElement()).find('table.htCore').width();
    const widthOfValueBox = $(byValueBoxRootElement()).width();

    expect(widthOfValueBox).toEqual(widthOfMenu);
  });

  it('should fit the single value to the value box element (pixel perfect)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      colHeaders: true,
      dropdownMenu: {
        items: {
          custom: {
            name: 'This is very long text which should expand the drop-down menu...'
          },
          filter_by_condition: {},
          filter_operators: {},
          filter_by_condition2: {},
          filter_by_value: {}
        }
      },
      filters: true
    });

    await dropdownMenu(1);

    await openDropdownByConditionMenu();
    $(conditionMenuRootElements().first).find('tbody td:contains("Begins with")')
      .simulate('mousedown')
      .simulate('mouseup');

    const widthOfValueBoxWithoutScroll = $(byValueBoxRootElement()).find('.wtHolder')[0].scrollWidth;
    const widthOfSingleValue = $(byValueBoxRootElement()).find('table.htCore tr:eq(0)').width();

    expect(widthOfSingleValue).toEqual(widthOfValueBoxWithoutScroll);
  });

  it('should display proper width of value box after change of another elements width to lower ' +
    '(bug: once rendered `MultipleSelectUI` has elbowed the table created by AutoColumnSize plugin)', async() => {
    handsontable({
      colHeaders: true,
      dropdownMenu: {
        items: {
          custom: {
            name: 'This is very long text which should expand the drop-down menu...'
          },
          filter_by_condition: {},
          filter_operators: {},
          filter_by_condition2: {},
          filter_by_value: {},
          filter_action_bar: {}
        }
      },
      filters: true
    });

    const $menu = $('.htDropdownMenu');

    await dropdownMenu(0);

    await waitForNextAnimationFrames(2);

    const firstWidth = $menu.find('.wtHider').width();

    await updateSettings({ dropdownMenu: true });

    await dropdownMenu(0);

    await waitForNextAnimationFrames(2);

    const nextWidth = $menu.find('.wtHider').width();

    expect(nextWidth).toBeLessThan(firstWidth);
  });

  it('should display proper width of the menu after second render (bug: effect of resizing menu by the 3px) - ' +
    'AutoColumnSize counts also border added to drop-down menu', async function() {
    handsontable({
      colHeaders: true,
      dropdownMenu: true,
      filters: true
    });

    const $menu = $('.htDropdownMenu');

    await dropdownMenu(0);

    await waitForNextAnimationFrames(2);

    const firstWidth = $menu.find('.wtHider').width();

    await mouseDown(this.$container);

    await dropdownMenu(0);

    await waitForNextAnimationFrames(2);

    const nextWidth = $menu.find('.wtHider').width();

    expect(nextWidth).toEqual(firstWidth);
  });

  it('should display proper width of conditional select', async() => {
    handsontable({
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      language: 'longerForTests'
    });

    await dropdownMenu(0);

    await openDropdownByConditionMenu();

    await waitForNextAnimationFrames(2);

    const $conditionalMenu = $('.htFiltersConditionsMenu');
    const firstWidth = $conditionalMenu.find('.wtHider').width();

    await updateSettings({ language: 'en-US' });

    await dropdownMenu(0);

    await openDropdownByConditionMenu();

    await waitForNextAnimationFrames(2);

    const nextWidth = $conditionalMenu.find('.wtHider').width();

    expect(nextWidth).toBeLessThanOrEqual(firstWidth);
  });

  it('should display proper width of htUIMultipleSelectHot container #151', async() => {
    handsontable({
      data: [
        [3, 'D'],
        [2, 'C'],
        [1, 'B'],
        [0, 'A this is very looooong text should expand the drop-down menu'],
        [3, 'f'],
        [2, '6'],
        [1, '!'],
        [0, 'A this']
      ],
      colHeaders: true,
      rowHeaders: true,
      dropdownMenu: true,
      filters: true
    });

    await dropdownMenu(0);

    await waitForNextAnimationFrames(2);

    const $multipleSelect = $('.htUIMultipleSelectHot');
    const wtHolderWidth = $multipleSelect.find('.wtHolder').width();
    const wtHiderWidth = $multipleSelect.find('.wtHider').width();

    expect(wtHiderWidth).toBeLessThan(wtHolderWidth);
  });

  it('should not expand the drop-down menu after selecting longer value inside the conditional select', async() => {
    handsontable({
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      language: 'longerForTests'
    });

    const $menu = $('.htDropdownMenu');

    await dropdownMenu(0);

    const firstWidth = $menu.find('.wtHider').width();

    await openDropdownByConditionMenu();

    await waitForNextAnimationFrames(2);

    const $conditionalMenu = $('.htFiltersConditionsMenu');
    const $conditionalMenuItems = $conditionalMenu.find('tbody td:not(.htSeparator)');

    $conditionalMenuItems.eq(1).simulate('mousedown').simulate('mouseup');

    const nextWidth = $menu.find('.wtHider').width();

    expect(nextWidth).toBe(firstWidth);
  });

  it('should not display extra condition element at start', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(1);
    expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
  });

  it('should show extra condition element after specific conditional options menu click', async() => {
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

    expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
    expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
    expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
  });

  it('should not show extra condition element after specific conditional options menu click', async() => {
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
    await selectDropdownByConditionMenuOption('None');

    expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
    expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
    expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
  });

  it('should hide extra condition element after specific conditional options menu click', async() => {
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
    await selectDropdownByConditionMenuOption('Is equal to');

    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('None');

    expect($(dropdownMenuRootElement()).is(':visible')).toBe(true);
    expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
    expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
  });

  it('should not show extra condition elements after changing value of cell when conditions wasn\'t set' +
    '(`conditionUpdateObserver` triggers hook)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    await selectCell(3, 0);
    await keyDownUp('enter');
    document.activeElement.value = '99';
    await keyDownUp('enter');

    await dropdownMenu(1);

    expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
    expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(false);
  });

  it('should show proper condition elements after changing value of cell when condition was set' +
    '(`conditionUpdateObserver` triggers hook)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    const filters = getPlugin('filters');

    filters.addCondition(1, 'gte', [10]);
    filters.filter();

    await selectCell(3, 0);
    await keyDownUp('enter');
    document.activeElement.value = '99';
    await keyDownUp('enter');

    await dropdownMenu(1);

    expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
    expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
    expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
  });

  it('should update components properly after API action #1', async() => {
    handsontable({
      data: [
        {
          id: 2,
          name: 'Leanne Ware',
          address: 'AAA City'
        },
        {
          id: 3,
          name: 'Mathis Boone',
          address: 'BBB City'
        },
        {
          id: 1,
          name: 'Nannie Patel',
          address: 'CCC City'
        }
      ],
      columns: [
        { data: 'id', type: 'numeric', title: 'ID' },
        { data: 'name', type: 'text', title: 'Full name' },
        { data: 'address', type: 'text', title: 'Address' }
      ],
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const filters = getPlugin('filters');

    filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
    filters.addCondition(1, 'contains', ['a']);
    filters.addCondition(1, 'not_contains', ['z']);
    filters.filter();

    await dropdownMenu(1);

    const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
    const checkedArray = checkboxes.map(element => element.checked);

    expect(checkedArray).toEqual([true, false, true]);
    expect($(conditionSelectRootElements().first).text()).toEqual('Contains');
    expect($(conditionSelectRootElements().second).text()).toEqual('Does not contain');

    expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
    expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
    expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
  });

  it('should update components properly after API action #2', async() => {
    handsontable({
      data: [
        {
          id: 2,
          name: 'Leanne Ware',
          address: 'AAA City'
        },
        {
          id: 3,
          name: 'Mathis Boone',
          address: 'BBB City'
        },
        {
          id: 1,
          name: 'Nannie Patel',
          address: 'CCC City'
        }
      ],
      columns: [
        { data: 'id', type: 'numeric', title: 'ID' },
        { data: 'name', type: 'text', title: 'Full name' },
        { data: 'address', type: 'text', title: 'Address' }
      ],
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const filters = getPlugin('filters');

    filters.addCondition(1, 'contains', ['a']);
    filters.addCondition(1, 'not_contains', ['z']);
    filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
    filters.filter();

    await dropdownMenu(1);

    const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
    const checkedArray = checkboxes.map(element => element.checked);

    expect(checkedArray).toEqual([true, false, true]);
    expect($(conditionSelectRootElements().first).text()).toEqual('Contains');
    expect($(conditionSelectRootElements().second).text()).toEqual('Does not contain');

    expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
    expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
    expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
  });

  it('should update components properly after API action #3', async() => {
    handsontable({
      data: [
        {
          id: 2,
          name: 'Leanne Ware',
          address: 'AAA City'
        },
        {
          id: 3,
          name: 'Mathis Boone',
          address: 'BBB City'
        },
        {
          id: 1,
          name: 'Nannie Patel',
          address: 'CCC City'
        }
      ],
      columns: [
        { data: 'id', type: 'numeric', title: 'ID' },
        { data: 'name', type: 'text', title: 'Full name' },
        { data: 'address', type: 'text', title: 'Address' }
      ],
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const filters = getPlugin('filters');

    filters.addCondition(1, 'contains', ['a']);
    filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
    filters.addCondition(1, 'not_contains', ['z']);
    filters.filter();

    await dropdownMenu(1);

    const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
    const checkedArray = checkboxes.map(element => element.checked);

    expect(checkedArray).toEqual([true, false, true]);
    expect($(conditionSelectRootElements().first).text()).toEqual('Contains');
    expect($(conditionSelectRootElements().second).text()).toEqual('Does not contain');

    expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
    expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
    expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
  });

  it('should update components properly after API action #4', async() => {
    handsontable({
      data: [
        {
          id: 2,
          name: 'Leanne Ware',
          address: 'AAA City'
        },
        {
          id: 3,
          name: 'Mathis Boone',
          address: 'BBB City'
        },
        {
          id: 1,
          name: 'Nannie Patel',
          address: 'CCC City'
        }
      ],
      columns: [
        { data: 'id', type: 'numeric', title: 'ID' },
        { data: 'name', type: 'text', title: 'Full name' },
        { data: 'address', type: 'text', title: 'Address' }
      ],
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const filters = getPlugin('filters');

    filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
    filters.addCondition(1, 'contains', ['a']);
    filters.filter();

    await dropdownMenu(1);

    const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
    const checkedArray = checkboxes.map(element => element.checked);

    expect(checkedArray).toEqual([true, false, true]);
    expect($(conditionSelectRootElements().first).text()).toEqual('Contains');
    expect($(conditionSelectRootElements().second).text()).toEqual('None');

    expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
    expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
    expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
  });

  it('should update components properly after API action #5', async() => {
    handsontable({
      data: [
        {
          id: 2,
          name: 'Leanne Ware',
          address: 'AAA City'
        },
        {
          id: 3,
          name: 'Mathis Boone',
          address: 'BBB City'
        },
        {
          id: 1,
          name: 'Nannie Patel',
          address: 'CCC City'
        }
      ],
      columns: [
        { data: 'id', type: 'numeric', title: 'ID' },
        { data: 'name', type: 'text', title: 'Full name' },
        { data: 'address', type: 'text', title: 'Address' }
      ],
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const filters = getPlugin('filters');

    filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
    filters.filter();

    await dropdownMenu(1);

    const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
    const checkedArray = checkboxes.map(element => element.checked);

    expect(checkedArray).toEqual([true, false, true]);
    expect($(conditionSelectRootElements().first).text()).toEqual('None');
    expect($(conditionSelectRootElements().second).text()).toEqual('None');

    expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
    expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
    expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(false);
  });

  it('should show last operation which was added from API and can be shown inside `dropdownMenu` #1', async() => {
    handsontable({
      data: [
        {
          id: 2,
          name: 'Leanne Ware',
          address: 'AAA City'
        },
        {
          id: 3,
          name: 'Mathis Boone',
          address: 'BBB City'
        },
        {
          id: 1,
          name: 'Nannie Patel',
          address: 'CCC City'
        }
      ],
      columns: [
        { data: 'id', type: 'numeric', title: 'ID' },
        { data: 'name', type: 'text', title: 'Full name' },
        { data: 'address', type: 'text', title: 'Address' }
      ],
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const filters = getPlugin('filters');

    filters.addCondition(1, 'contains', ['e']);
    filters.addCondition(1, 'not_contains', ['z']);
    filters.addCondition(1, 'not_empty', []);
    filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
    filters.filter();

    await dropdownMenu(1);

    const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
    const checkedArray = checkboxes.map(element => element.checked);

    // Watch out! Filters build values inside `by_value` (checkbox inputs) component basing on all applied filters
    expect(checkedArray).toEqual([true, true]);
    expect($(conditionSelectRootElements().first).text()).toEqual('Contains');
    expect($(conditionSelectRootElements().second).text()).toEqual('Does not contain');

    expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
    expect($(conditionSelectRootElements().second).is(':visible')).toBe(true);
    expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(true);
  });

  it('should show last operation which was added from API and can be shown inside `dropdownMenu` #2', async() => {
    handsontable({
      data: [
        {
          id: 2,
          name: 'Leanne Ware',
          address: 'AAA City'
        },
        {
          id: 3,
          name: 'Mathis Boone',
          address: 'BBB City'
        },
        {
          id: 1,
          name: 'Nannie Patel',
          address: 'CCC City'
        }
      ],
      columns: [
        { data: 'id', type: 'numeric', title: 'ID' },
        { data: 'name', type: 'text', title: 'Full name' },
        { data: 'address', type: 'text', title: 'Address' }
      ],
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const filters = getPlugin('filters');

    filters.addCondition(1, 'by_value', [['Nannie Patel', 'Leanne Ware']]);
    filters.addCondition(1, 'by_value', [['Mathis Boone']]);
    filters.filter();

    await dropdownMenu(1);

    const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
    const checkedArray = checkboxes.map(element => element.checked);

    expect(checkedArray).toEqual([true, false, true]);
    expect($(conditionSelectRootElements().first).text()).toEqual('None');
    expect($(conditionSelectRootElements().second).text()).toEqual('None');

    expect($(conditionSelectRootElements().first).is(':visible')).toBe(true);
    expect($(conditionSelectRootElements().second).is(':visible')).toBe(false);
    expect($(conditionRadioInput(0).element).parent().is(':visible')).toBe(false);
  });

  // regression check for #dev-2036
  it('should be possible to focus menu filter component after calling `updateSettings`', async() => {
    handsontable({
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
    });

    await dropdownMenu(0);
    await waitForNextAnimationFrames(2);

    {
      const menuShortcutManager = getPlugin('dropdownMenu').menu.hotMenu.getShortcutManager();

      expect(menuShortcutManager.getActiveContextName()).toBe('menu');

      byValueMultipleSelect().element.querySelector('input').focus();

      expect(menuShortcutManager.getActiveContextName()).toBe('menu:filters');
    }

    await updateSettings({ dropdownMenu: true });
    await dropdownMenu(0);
    await waitForNextAnimationFrames(2);

    {
      const menuShortcutManager = getPlugin('dropdownMenu').menu.hotMenu.getShortcutManager();

      expect(menuShortcutManager.getActiveContextName()).toBe('menu');

      byValueMultipleSelect().element.querySelector('input').focus();

      expect(menuShortcutManager.getActiveContextName()).toBe('menu:filters');
    }
  });
});
