describe('Filters UI', () => {
  const id = 'testContainer';

  beforeAll(() => {
    // Note: please keep in mind that this language will be registered for all e2e tests!
    // It's stored globally for already loaded Handsontable library.
    Handsontable.languages.registerLanguageDictionary({
      languageCode: 'longerForTests',
      'Filters:conditions.isEmpty': 'This is very long text for conditional menu item'
    });
  });

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should deselect all values in "Filter by value" after clicking "Clear" link', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(1);

    await sleep(112);

    $(dropdownMenuRootElement().querySelector('.htUIClearAll a')).simulate('click');

    expect(byValueMultipleSelect().getItems().map(o => o.checked).indexOf(true)).toBe(-1);
  });

  it('should select all values in "Filter by value" after clicking "Select all" link', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(1);
    await sleep(112);

    $(dropdownMenuRootElement().querySelector('.htUIClearAll a')).simulate('click');

    expect(byValueMultipleSelect().getItems().map(o => o.checked).indexOf(true)).toBe(-1);

    $(dropdownMenuRootElement().querySelector('.htUISelectAll a')).simulate('click');

    expect(byValueMultipleSelect().getItems().map(o => o.checked).indexOf(false)).toBe(-1);
  });

  it('should not reset the selection status of the "Filter by value" section after scrolling the table outside of' +
    ' the viewport', async() => {
    spec().$container.css({
      marginBottom: 10000,
      marginRight: 10000
    });

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
    });

    await dropdownMenu(1);

    const multipleSelectElement = byValueMultipleSelect().element;

    await sleep(112);

    $(dropdownMenuRootElement().querySelector('.htUIClearAll a')).simulate('click');

    await sleep(208);

    expect(byValueMultipleSelect().getItems().map(o => o.checked).indexOf(true)).toBe(-1);

    await scrollWindowBy(0, 9500);

    await sleep(208);

    await scrollWindowBy(0, -9500);

    await sleep(208);

    multipleSelectElement.querySelector('.handsontable .wtHolder').scrollBy(0, 10);

    await sleep(208);

    expect(byValueMultipleSelect().getItems().map(o => o.checked).indexOf(true)).toBe(-1);
  });

  it('should open dropdown menu properly, when there are multiple Handsontable instances present', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    const hot2Container = document.createElement('DIV');

    document.body.appendChild(hot2Container);
    const hot2 = new Handsontable(hot2Container, {
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    expect(document.querySelectorAll('.htDropdownMenu').length).toBe(2);

    await dropdownMenu(1);

    expect(getPlugin('dropdownMenu').menu.container.style.display).toBe('block');
    expect(getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);
    expect(hot2.getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    expect(hot2.getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);

    $(document.body).simulate('mousedown');
    $(document.body).simulate('mouseup');
    $(document.body).simulate('click');

    expect(getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    expect(getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);
    expect(hot2.getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    expect(hot2.getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);

    const th = hot2.view._wt.wtTable.getColumnHeader(1);
    const button = th.querySelector('.changeType');

    $(button).simulate('mousedown');
    $(button).simulate('mouseup');
    $(button).simulate('click');

    expect(getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    expect(getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);
    expect(hot2.getPlugin('dropdownMenu').menu.container.style.display).toBe('block');
    expect(hot2.getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);

    await dropdownMenu(1);

    expect(getPlugin('dropdownMenu').menu.container.style.display).toBe('block');
    expect(getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);
    expect(hot2.getPlugin('dropdownMenu').menu.container.style.display).not.toBe('block');
    expect(hot2.getPlugin('dropdownMenu').menu.container.parentElement).not.toBe(null);

    hot2.destroy();
    hot2Container.parentElement.removeChild(hot2Container);
  });

  it('should display data and filter\'s box properly when there was the `clearConditions` call and the `loadData` call #5244', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      colHeaders: true,
      rowHeaders: true,
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(1, 'begins_with', ['m']);
    plugin.filter();
    plugin.clearConditions();

    await loadData([{
      id: 1,
      name: 'Nannie Patel',
      address: 'Jenkinsville',
      registered: '2014-01-29',
      eyeColor: { color: 'green' },
      balance: 1261.6,
      active: true,
    }, {
      id: 2,
      name: 'Mcintyre Clarke',
      address: 'Wakarusa',
      registered: '2014-06-28',
      eyeColor: { color: 'green' },
      balance: 3012.56,
      active: true,
    }]);

    await dropdownMenu(1);

    const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
    const checkedArray = checkboxes.map(element => element.checked);
    const labels = $(byValueBoxRootElement()).find('label').toArray();
    const texts = labels.map(element => $(element).text());

    expect(texts).toEqual(['Mcintyre Clarke', 'Nannie Patel']);
    expect(checkedArray).toEqual([true, true]);
    expect(checkboxes.length).toBe(2);
  });

  it('should refresh the "Filter by value" list to include newly added values after `updateData` ' +
    'is called while a `by_value` filter is active #9259', async() => {
    handsontable({
      data: [['Adam']],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(0, 'by_value', [['Adam']]);
    plugin.filter();

    await updateData([['Adam'], ['John'], ['Tim']]);

    await dropdownMenu(0);
    await sleep(112);

    const items = byValueMultipleSelect().getItems();
    const values = items.map(item => item.value);
    const checked = items.map(item => item.checked);

    expect(values).toEqual(['Adam', 'John', 'Tim']);
    expect(checked).toEqual([true, false, false]);
  });

  it('should refresh the "Filter by value" list on every filtered column after `updateData` #9259', async() => {
    handsontable({
      data: [['Adam', 'NY']],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(0, 'by_value', [['Adam']]);
    plugin.addCondition(1, 'by_value', [['NY']]);
    plugin.filter();

    await updateData([
      ['Adam', 'NY'],
      ['Adam', 'LA'],
      ['John', 'SF'],
    ]);

    await dropdownMenu(0);
    await sleep(112);

    const col0Items = byValueMultipleSelect().getItems();

    expect(col0Items.map(i => i.value)).toEqual(['Adam', 'John']);
    expect(col0Items.map(i => i.checked)).toEqual([true, false]);

    await dropdownMenu(1);
    await sleep(112);

    // The "Filter by value" picker for column 1 lists values from source rows that pass
    // all preceding columns' conditions (standard pivot behavior). Column 0 keeps `by_value=[Adam]`,
    // so only rows with `Adam` contribute: values `NY` and `LA`.
    const col1Items = byValueMultipleSelect().getItems();

    expect(col1Items.map(i => i.value)).toEqual(['LA', 'NY']);
    expect(col1Items.map(i => i.checked)).toEqual([false, true]);
  });

  it('should restore correct components\' state after altering columns', async() => {
    handsontable({
      data: [
        [1, 'Nannie Patel', 'Jenkinsville'],
        [2, 'Leanne Ware', 'Gardiner'],
        [3, 'Mathis Boone', 'Saranap'],
        [4, 'Cruz Benjamin', 'Cascades'],
        [5, 'Reese David', 'Soham'],
        [6, 'Ernestine Wiggins', 'Needmore'],
        [7, 'Chelsea Solomon', 'Alamo'],
      ],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(0);
    await simulateClick(dropdownMenuRootElement().querySelectorAll('.htUISelect')[0]);
    await selectDropdownByConditionMenuOption('Contains');

    await sleep(208);

    // Contains '2'
    document.activeElement.value = '2';
    await keyUp('2');

    await simulateClick(dropdownMenuRootElement().querySelectorAll('.htUISelect')[1]);
    await selectDropdownByConditionMenuOption('Contains', 'second');

    await sleep(208);

    // Contains '5'
    document.activeElement.value = '5';
    await keyUp('5');

    // Select "OR"
    await simulateClick(conditionRadioInput(1).element.querySelector('input'));
    await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

    await dropdownMenu(2);

    // uncheck the second record
    await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(2) [type=checkbox]'));
    await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

    hot().alter('insert_col_start', 0);
    hot().alter('remove_col', 2);

    {
      await dropdownMenu(0);

      const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

      expect($(inputs[0]).is(':visible')).toBe(false);
      expect(inputs[0].value).toBe('');
      expect($(inputs[1]).is(':visible')).toBe(false);
      expect(inputs[1].value).toBe('');
      expect(conditionSelectRootElements().first.textContent).toBe('None');
      expect(conditionSelectRootElements().second.textContent).toBe('None');
      expect(byValueMultipleSelect().getItems().length).toBe(1);
      expect(byValueMultipleSelect().getValue().length).toBe(1);
    }
    {
      await dropdownMenu(1);

      const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

      expect($(inputs[0]).is(':visible')).toBe(true);
      expect(inputs[0].value).toBe('2');
      expect($(inputs[1]).is(':visible')).toBe(false);
      expect(inputs[1].value).toBe('');
      expect($(inputs[2]).is(':visible')).toBe(true);
      expect(inputs[2].value).toBe('5');
      expect(conditionSelectRootElements().first.textContent).toBe('Contains');
      expect(conditionSelectRootElements().second.textContent).toBe('Contains');
      expect(byValueMultipleSelect().getItems().length).toBe(1);
      expect(byValueMultipleSelect().getValue().length).toBe(1);
    }
    {
      await dropdownMenu(2);

      const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input');

      expect($(inputs[0]).is(':visible')).toBe(false);
      expect(inputs[0].value).toBe('');
      expect($(inputs[1]).is(':visible')).toBe(false);
      expect(inputs[1].value).toBe('');
      expect(conditionSelectRootElements().first.textContent).toBe('None');
      expect(conditionSelectRootElements().second.textContent).toBe('None');
      expect(byValueMultipleSelect().getItems().length).toBe(2);
      expect(byValueMultipleSelect().getValue().length).toBe(1);
    }
  });

  it('should select the first visible row after filtering (navigableHeaders: false)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      navigableHeaders: false,
      width: 500,
      height: 300
    });

    await dropdownMenu(2);
    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('Is empty');

    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
      .simulate('click');

    expect(getSelectedRange()).toBeUndefined();

    await dropdownMenu(2);
    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('None');
    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
      .simulate('click');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
  });

  it('should select the column header after filtering (navigableHeaders: true)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      navigableHeaders: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(2);
    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('Is empty');

    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
      .simulate('click');

    expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);

    await dropdownMenu(2);
    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('None');

    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
      .simulate('click');

    expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
  });

  describe('Simple filtering (one column)', () => {
    it('should filter empty values and revert back after removing filter', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Is empty');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
        .simulate('click');

      expect(getData().length).toBe(0);

      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('None');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
        .simulate('click');

      expect(getData().length).toBe(39);
    });

    it('should filter numeric value (greater than)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Greater than');
      await sleep(208);

      // Greater than 12
      document.activeElement.value = '12';
      await keyUp('2');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(27);
      expect(getData()[0][0]).toBe(13);
      expect(getData()[0][1]).toBe('Dina Randolph');
      expect(getData()[0][2]).toBe('Henrietta');
      expect(getData()[0][3]).toBe('2014-04-29');
      expect(getData()[0][4]).toBe('blue');
      expect(getData()[0][5]).toBe(3827.99);
      expect(getDataAtCol(0).join())
        .toBe('13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39');
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

      await dropdownMenu(1);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Contains');
      await sleep(208);

      // Contains ej
      document.activeElement.value = 'ej';
      await keyUp('j');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(1);
      expect(getData()[0][0]).toBe(23);
      expect(getData()[0][1]).toBe('Mejia Osborne');
      expect(getData()[0][2]).toBe('Fowlerville');
      expect(getData()[0][3]).toBe('2014-05-24');
      expect(getData()[0][4]).toBe('blue');
      expect(getData()[0][5]).toBe(1852.34);
      expect(getData()[0][6]).toBe(false);
      expect(getDataAtCol(1).join()).toBe('Mejia Osborne');
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

      await dropdownMenu(3);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Yesterday');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(3);
      expect(getData()[0][0]).toBe(26);
      expect(getData()[0][1]).toBe('Stanton Britt');
      expect(getData()[0][2]).toBe('Nipinnawasee');
      expect(getData()[0][3]).toBe(addDays(-1));
      expect(getData()[0][4]).toBe('green');
      expect(getData()[0][5]).toBe(3592.18);
      expect(getData()[0][6]).toBe(false);
      expect(getDataAtCol(3).join()).toBe([
        addDays(-1),
        addDays(-1),
        addDays(-1),
      ].join());
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

      await selectCell(0, 6);
      await dropdownMenu(6);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Contains');

      await sleep(208);

      // Is equal to 'true'
      document.activeElement.value = 'true';

      await keyUp('t');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(18);
      expect(getData()[0][0]).toBe(1);
      expect(getData()[0][1]).toBe('Nannie Patel');
      expect(getData()[0][2]).toBe('Jenkinsville');
      expect(getData()[0][3]).toBe('2014-01-29');
      expect(getData()[0][4]).toBe('green');
      expect(getData()[0][5]).toBe(1261.60);
      expect(getData()[0][6]).toBe(true);
      expect(getDataAtCol(6).join())
        .toBe('true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true');
    });

    it('should filter values using "by value" method (by changing checkbox states)', async() => {
      handsontable({
        data: getDataForFilters().slice(0, 15),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(2);
      await sleep(208);

      // disable first 5 records
      $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox').simulate('click');
      $(byValueBoxRootElement()).find('tr:nth-child(2) :checkbox').simulate('click');
      $(byValueBoxRootElement()).find('tr:nth-child(3) :checkbox').simulate('click');
      $(byValueBoxRootElement()).find('tr:nth-child(4) :checkbox').simulate('click');
      $(byValueBoxRootElement()).find('tr:nth-child(5) :checkbox').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toBe(10);
      expect(getDataAtCol(2).join())
        .toBe('Jenkinsville,Gardiner,Saranap,Soham,Needmore,Wakarusa,Yukon,Layhill,Henrietta,Wildwood');
    });

    it('should overwrite condition filter when at specified column filter was already applied', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Is equal to');
      await sleep(208);

      // Is equal to '5'
      document.activeElement.value = '5';

      await keyUp('5');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(1);

      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Less than');
      await sleep(208);

      // Less than
      document.activeElement.value = '8';

      await keyUp('8');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(16);

      expect(getData().length).toEqual(7);
    });

    it('should filter values again when data was changed', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Less than');

      await sleep(208);

      // Less than
      document.activeElement.value = '8';

      await keyUp('8');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toBe(7);

      await selectCell(3, 0);
      await keyDownUp('enter');

      document.activeElement.value = '99';

      await keyDownUp('enter');
      await sleep(208);
      await dropdownMenu(0);

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(16);

      expect(getData().length).toBe(6);
    });

    it('should filter values again when data was changed (filter by value)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(2);
      await sleep(208);

      byValueMultipleSelect().setValue(['Bowie', 'Coral']);
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(2);
      await sleep(208);

      byValueMultipleSelect().setValue(['Alamo', 'Coral', 'Canby']);
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getDataAtCol(2).join()).toBe('Alamo,Canby,Coral');
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

      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Greater than');

      await sleep(112);

      // Greater than 12
      document.activeElement.value = '12';

      await keyUp('2');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(2);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');
      await sleep(112);

      document.activeElement.value = 'b';

      await keyUp('b');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      // this condition needs extra time to apply filters
      await sleep(16);
      await dropdownMenu(4);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Is equal to');
      await sleep(112);

      document.activeElement.value = 'green';

      await keyUp('n');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(16);

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
      expect(getData()[1][3]).toBe(addDays(-2));
      expect(getData()[1][4]).toBe('green');
      expect(getData()[1][5]).toBe(2437.58);
      expect(getData()[1][6]).toBe(false);
    });

    it('should filter values from 3 columns (2 conditional and 1 by value)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Greater than');
      await sleep(208);

      // Greater than 12
      document.activeElement.value = '12';

      await keyUp('2');
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await dropdownMenu(2);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');
      await sleep(208);

      document.activeElement.value = 'b';
      await keyUp('b');
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await dropdownMenu(4);
      // uncheck first record
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));

      await sleep(208);
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await sleep(16);

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
      expect(getData()[1][3]).toBe(addDays(-2));
      expect(getData()[1][4]).toBe('green');
      expect(getData()[1][5]).toBe(2437.58);
      expect(getData()[1][6]).toBe(false);
    });

    it('should filter values from few columns (after change first column condition)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Greater than');

      await sleep(208);

      // Greater than 12
      document.activeElement.value = '12';

      await keyUp('2');
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await dropdownMenu(2);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');

      await sleep(208);

      document.activeElement.value = 'b';

      await keyUp('b');
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      // Change first added filter condition. First added condition is responsible for defining data root chain.
      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Is between');

      await sleep(208);
      const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition input');

      inputs[0].value = '1';
      inputs[1].value = '15';
      await keyUp('1', { target: inputs[0] });
      await keyUp('5', { target: inputs[1] });
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await sleep(16);

      expect(getData().length).toEqual(1);
      expect(getData()[0][0]).toBe(14);
      expect(getData()[0][1]).toBe('Helga Mathis');
      expect(getData()[0][2]).toBe('Brownsville');
      expect(getData()[0][3]).toBe('2015-03-22');
      expect(getData()[0][4]).toBe('brown');
      expect(getData()[0][5]).toBe(3917.34);
      expect(getData()[0][6]).toBe(true);
    });

    it('should apply filtered values to the next "by value" component defined after edited conditions', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Greater than');

      await sleep(208);

      // Greater than 25
      document.activeElement.value = '25';
      await keyUp('5');
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await dropdownMenu(2);
      await sleep(208);

      // uncheck
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(3) [type=checkbox]'));
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(4) [type=checkbox]'));
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await dropdownMenu(1);
      await sleep(208);

      // uncheck
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(2) [type=checkbox]'));
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      expect(byValueMultipleSelect().getItems().length).toBe(11);
      expect(byValueMultipleSelect().getValue().length).toBe(9);

      await dropdownMenu(4);
      await sleep(208);

      // uncheck
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(2) [type=checkbox]'));
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      expect(byValueMultipleSelect().getItems().length).toBe(3);
      expect(byValueMultipleSelect().getValue().length).toBe(1);

      await dropdownMenu(2);
      await sleep(208);

      // check again (disable filter)
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(3) [type=checkbox]'));
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(4) [type=checkbox]'));
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await dropdownMenu(1);
      await sleep(208);

      expect(byValueMultipleSelect().getItems().length).toBe(14);
      expect(byValueMultipleSelect().getValue().length).toBe(9);

      await dropdownMenu(4);
      await sleep(208);

      // unchanged state for condition behind second condition
      expect(byValueMultipleSelect().getItems().length).toBe(3);
      expect(byValueMultipleSelect().getValue().length).toBe(1);
    });

    // The test checks if the IndexMap isn't accidentally unregistered in the ConditionCollection
    // class after opening the menu. It causes the column indication misalignment.
    it('should update filtering state within column header after removing column on the left', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        data: createSpreadsheetData(3, 3),
        filters: true,
      });

      await dropdownMenu(1);
      await openDropdownByConditionMenu();
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await sleep(208);
      await alter('remove_col', 0);

      expect(getData()).toEqual([
        ['B2', 'C2'],
        ['B3', 'C3'],
      ]);
      expect(spec().$container.find('th:eq(0)').hasClass('htFiltersActive')).toEqual(true);
      expect(spec().$container.find('th:eq(1)').hasClass('htFiltersActive')).toEqual(false);
    });

    it('should update conditions properly - execution queue for conditions should not be lost after using ' +
      'UI of drop-down menu', async() => {
      handsontable({
        data: [
          { id: 1, name: 'Ted Right', address: 'A001' },
          { id: 2, name: 'Frank Honest', address: 'A002' },
          { id: 3, name: 'Joan Well', address: 'B001' },
          { id: 4, name: 'Gail Polite', address: 'B002' },
          { id: 5, name: 'Michael Fair', address: 'C001' },
          { id: 6, name: 'Mark Malcovich', address: 'C002' },
        ],
        columns: [
          { data: 'id' },
          { data: 'name' },
          { data: 'address' }
        ],
        filters: true,
        dropdownMenu: true,
        colHeaders: true
      });

      const filtersPlugin = getPlugin('filters');

      filtersPlugin.addCondition(1, 'by_value', [['Ted Right', 'Joan Well', 'Gail Polite', 'Michael Fair']]);
      filtersPlugin.addCondition(0, 'by_value', [[3, 5]]);
      filtersPlugin.addCondition(2, 'by_value', [['C001']]);
      filtersPlugin.filter();

      await dropdownMenu(1);

      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(4) [type=checkbox]'));
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await sleep(304);

      await dropdownMenu(0);
      expect(byValueMultipleSelect().getItems().length).toBe(5);
      expect(byValueMultipleSelect().getValue().length).toBe(2);
      expect(byValueMultipleSelect().getItems()[4]).toEqual({ checked: false, value: 6, visualValue: 6 });
    });
  });

  describe('Advanced filtering (conditions and operations combination #160)', () => {
    it('should filter data properly when `disjunction` operation was chosen and ' +
      'only one conditional was selected', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(1);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');

      await sleep(208);

      document.activeElement.value = 'm';

      await keyUp('m');

      // disjunction
      $(conditionRadioInput(1).element).find('input[type="radio"]').simulate('click');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      expect(getData().length).toBe(5);
    });

    it('should not change data when operation was changed from `disjunction` to `conjunction` ' +
      'after filtering data by only one condition', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(1);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');
      await sleep(304);

      document.activeElement.value = 'm';

      await keyUp('m');

      // conjunction
      $(conditionRadioInput(1).element).find('input[type="radio"]').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(1);
      await sleep(304);

      expect(getData().length).toBe(5);

      // disjunction
      $(conditionRadioInput(0).element).find('input[type="radio"]').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(304);

      expect(getData().length).toBe(5);
    });

    it('should filter data properly after changing operator (`conjunction` <-> `disjunction` operation)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(1);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');

      await sleep(304);

      document.activeElement.value = 'm';

      await keyUp('m');

      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');

      await sleep(304);

      document.activeElement.value = 'e';

      await keyUp('e');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toBe(3);

      await dropdownMenu(1);
      await sleep(304);

      // disjunction
      $(conditionRadioInput(1).element).find('input[type="radio"]').simulate('click');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      expect(getData().length).toBe(7);

      await dropdownMenu(1);
      await sleep(304);
      // conjunction
      $(conditionRadioInput(0).element).find('input[type="radio"]').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toBe(3);
    });

    it('should filter data properly after clearing second input', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(1);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');

      await sleep(208);

      document.activeElement.value = 'm';

      await keyUp('m');
      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');
      await sleep(208);

      document.activeElement.value = 'e';

      await keyUp('e');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(208);
      await dropdownMenu(1);
      await sleep(208);

      document.activeElement.value = '';

      await keyUp('Backspace');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(208);

      expect(getData().length).toBe(5);
    });

    it('should filter data properly after resetting second condition `SelectUI` (value set to `None`)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(1);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');

      await sleep(304);

      document.activeElement.value = 'm';

      await keyUp('m');
      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');
      await sleep(304);

      document.activeElement.value = 'e';

      await keyUp('e');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(304);
      await dropdownMenu(1);
      await sleep(304);

      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('None', 'second');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(304);

      expect(getData().length).toBe(5);
      expect($(conditionSelectRootElements().second).text()).toEqual('None');
    });
  });

  describe('Advanced filtering (conditions, operations and "by value" component #160)', () => {
    it('First conditional chosen -> filter operation -> unchecked first value from multiple select -> selected `disjunction` operation -> filter operation', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(1);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');
      await sleep(208);

      document.activeElement.value = 'm';

      await keyUp('m');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(16);

      expect(getData().length).toBe(5);

      await dropdownMenu(1);
      await sleep(208);

      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.eq(0).simulate('click');
      // disjunction
      $(conditionRadioInput(1).element).find('input[type="radio"]').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(16);

      expect(getData().length).toBe(4);
    });

    it('Two conditionals chosen -> filter operation -> unchecked first value from multiple select -> filter operation', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(1);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');

      await sleep(208);

      document.activeElement.value = 'm';

      await keyUp('m');
      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');
      await sleep(208);

      document.activeElement.value = 'e';

      await keyUp('e');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(1);
      await sleep(208);

      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.eq(0).simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(16);

      expect(getData().length).toBe(2);
    });

    it('Two conditionals chosen & unchecked value which will be filtered by conditions -> filter operation', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(1);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');

      await sleep(208);

      document.activeElement.value = 'm';

      await keyUp('m');
      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');
      await sleep(208);

      document.activeElement.value = 'e';

      await keyUp('e');

      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      // Alice Blake
      $multipleSelectElements.eq(0).simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(16);

      expect(getData().length).toBe(3);
    });

    it('Two conditionals chosen & unchecked value which won\'t be filtered by conditions -> filter operation', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(1);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');
      await sleep(208);

      document.activeElement.value = 'm';

      await keyUp('m');

      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');
      await sleep(208);

      document.activeElement.value = 'e';

      await keyUp('e');

      byValueMultipleSelect().getItemsBox().selectCell(23, 0);

      // Mathis Boone, 23th element
      await simulateClick(byValueBoxRootElement().querySelector('[aria-rowindex="24"] input'));

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(16);

      expect(getData().length).toBe(2);
    });
  });

  describe('API + UI #116', () => {
    it('should change state of components by plugin function calls', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'begins_with', ['m'], 'conjunction');
      plugin.addCondition(1, 'ends_with', ['e'], 'conjunction');
      plugin.filter();

      await dropdownMenu(1);
      await sleep(208);

      expect($(conditionSelectRootElements().first).text()).toEqual('Begins with');
      expect($(conditionSelectRootElements().second).text()).toEqual('Ends with');
      expect($(conditionRadioInput(0).element).parent().find(':checked').parent().text()).toEqual('And');
    });

    it('should not change state of components and data after clicking `OK` button', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'begins_with', ['m'], 'disjunction');
      plugin.addCondition(1, 'ends_with', ['e'], 'disjunction');
      plugin.filter();

      const dataLength = getData().length;

      await dropdownMenu(1);
      await sleep(208);

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(1);
      await sleep(208);

      expect(getData().length).toEqual(dataLength);
      expect($(conditionSelectRootElements().first).text()).toEqual('Begins with');
      expect($(conditionSelectRootElements().second).text()).toEqual('Ends with');
      expect($(conditionRadioInput(0).element).parent().find(':checked').parent().text()).toEqual('Or');
    });

    it('should allow to perform changes on conditions by UI, when they were added by API before #1', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'begins_with', ['m'], 'disjunction');
      plugin.filter();

      const dateLength = getData().length;

      await dropdownMenu(1);
      await sleep(208);

      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.eq(0).simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(1);
      await sleep(208);

      expect($(conditionSelectRootElements().first).text()).toEqual('Begins with');
      expect($(conditionSelectRootElements().second).text()).toEqual('None');

      // original state (now performing `conjunction` operation)
      expect($(conditionRadioInput(0).element).parent().find(':checked').parent().text()).toEqual('Or');
      expect(getData().length).toEqual(dateLength - 1);
    });

    it('should allow to perform changes on conditions by UI, when they were added by API before #1', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(1, 'begins_with', ['m'], 'disjunction');
      plugin.addCondition(1, 'ends_with', ['e'], 'disjunction');
      plugin.filter();

      const dateLength = getData().length;

      await dropdownMenu(1);
      await sleep(208);

      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.eq(0).simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(1);
      await sleep(208);

      expect($(conditionSelectRootElements().first).text()).toEqual('Begins with');
      expect($(conditionSelectRootElements().second).text()).toEqual('Ends with');

      // original state (now performing `disjunctionWithExtraCondition` operation)
      expect($(conditionRadioInput(0).element).parent().find(':checked').parent().text()).toEqual('Or');
      expect(getData().length).toEqual(dateLength - 1);
    });
  });

  describe('searchMode', () => {
    it('should apply filters for all filtered items from the list when searchMode is `apply`', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: {
          searchMode: 'apply'
        },
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(2);

      byValueMultipleSelect().element.querySelector('input').focus();

      await sleep(208);

      const event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });

      document.activeElement.value = 'c';
      document.activeElement.dispatchEvent(event);

      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      expect(getData()[0][2]).toBe('Cascades');
      expect(getData().length).toBe(5);
    });

    it('should apply filters for all filtered items from the list when searchMode is `apply` some checkboxes are unchecked', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: {
          searchMode: 'apply'
        },
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(2);

      $(dropdownMenuRootElement().querySelector('.htUIClearAll a')).simulate('click');

      byValueMultipleSelect().element.querySelector('input').focus();

      await sleep(208);

      const event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });

      document.activeElement.value = 'ca';
      document.activeElement.dispatchEvent(event);

      const $multipleSelectElements = $('.htUIMultipleSelectHot td input');

      $multipleSelectElements.eq(1).simulate('click');

      await sleep(208);

      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      expect(getData()[0][2]).toBe('Canby');
      expect(getData().length).toBe(1);
    });

    it('should apply the filter when the input is focused and Enter is pressed when searchMode is `apply`', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: {
          searchMode: 'apply'
        },
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(2);

      byValueMultipleSelect().element.querySelector('input').focus();

      await sleep(208);

      const event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });

      document.activeElement.value = 'c';
      document.activeElement.dispatchEvent(event);

      await keyDownUp('Enter');

      expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
      expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);

      expect(getData()[0][2]).toBe('Cascades');
      expect(getData().length).toBe(5);
    });

    it('should call `hideRows` once with all non-matching indices when searchMode is `apply` (#12104)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: {
          searchMode: 'apply'
        },
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(2);

      const multipleSelect = byValueMultipleSelect();
      const itemsBox = multipleSelect.getItemsBox();
      const hiddenRows = itemsBox.getPlugin('hiddenRows');

      spyOn(hiddenRows, 'hideRows').and.callThrough();
      spyOn(hiddenRows, 'hideRow').and.callThrough();

      multipleSelect.element.querySelector('input').focus();

      await sleep(200);

      const event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });

      document.activeElement.value = 'c';
      document.activeElement.dispatchEvent(event);

      expect(hiddenRows.hideRows).toHaveBeenCalledTimes(1);
      expect(hiddenRows.hideRow).not.toHaveBeenCalled();
    });

    it('should correctly check matching items and hide non-matching items when searchMode is `apply`', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: {
          searchMode: 'apply'
        },
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(2);

      const multipleSelect = byValueMultipleSelect();

      multipleSelect.element.querySelector('input').focus();

      await sleep(200);

      const event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });

      document.activeElement.value = 'c';
      document.activeElement.dispatchEvent(event);

      const items = multipleSelect.getItems();
      const checkedItems = items.filter(item => item.checked);
      const uncheckedItems = items.filter(item => !item.checked);

      checkedItems.forEach((item) => {
        expect(`${item.value}`.toLowerCase()).toContain('c');
      });

      uncheckedItems.forEach((item) => {
        expect(`${item.value}`.toLowerCase()).not.toContain('c');
      });

      const itemsBox = multipleSelect.getItemsBox();
      const hiddenRowsPlugin = itemsBox.getPlugin('hiddenRows');
      const hiddenRowCount = hiddenRowsPlugin.getHiddenRows().length;

      expect(hiddenRowCount).toBe(uncheckedItems.length);
    });

    it('should correctly update visible items after consecutive searches when searchMode is `apply`', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: {
          searchMode: 'apply'
        },
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(2);

      const multipleSelect = byValueMultipleSelect();

      multipleSelect.element.querySelector('input').focus();

      await sleep(200);

      const inputEvent = new Event('input', { bubbles: true, cancelable: true });

      document.activeElement.value = 'c';
      document.activeElement.dispatchEvent(inputEvent);

      const firstSearchChecked = multipleSelect.getItems().filter(item => item.checked).length;

      const inputEvent2 = new Event('input', { bubbles: true, cancelable: true });

      document.activeElement.value = '';
      document.activeElement.dispatchEvent(inputEvent2);

      const afterClearChecked = multipleSelect.getItems().filter(item => item.checked).length;

      expect(afterClearChecked).toBe(multipleSelect.getItems().length);
      expect(afterClearChecked).toBeGreaterThan(firstSearchChecked);

      const itemsBox = multipleSelect.getItemsBox();
      const hiddenRowsPlugin = itemsBox.getPlugin('hiddenRows');

      expect(hiddenRowsPlugin.getHiddenRows().length).toBe(0);
    });
  });

  it('should be possible to filter data "by value" changing the condition on each filter (#dev-2962)', async() => {
    handsontable({
      data: [
        ['Completed'],
        ['Open'],
        ['Completed'],
        ['Open'],
        ['Completed'],
      ],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
    });

    await dropdownMenu(0);
    // Select only "Completed"
    await simulateClick(byValueBoxRootElement().querySelector('[aria-rowindex="2"] input'));
    await simulateClick(getFilterDropdownMenuOKButton());

    expect(getData()).toEqual([
      ['Completed'],
      ['Completed'],
      ['Completed'],
    ]);

    await dropdownMenu(0);

    // Select only "Open"
    await simulateClick(byValueBoxRootElement().querySelector('[aria-rowindex="1"] input'));
    await simulateClick(byValueBoxRootElement().querySelector('[aria-rowindex="2"] input'));
    await simulateClick(getFilterDropdownMenuOKButton());

    expect(getData()).toEqual([
      ['Open'],
      ['Open'],
    ]);
  });

  it('should not inherit font family and size from body', async() => {
    handsontable({
      data: getDataForFilters(),
      colHeaders: true,
      filters: true,
      dropdownMenu: true
    });

    const body = document.body;
    const bodyStyle = body.style;
    const fontFamily = bodyStyle.fontFamily;
    const fontSize = bodyStyle.fontSize;

    bodyStyle.fontFamily = 'Helvetica';
    bodyStyle.fontSize = '24px';

    await dropdownMenu(0);

    const htItemWrapper = document.querySelector('.htItemWrapper');
    const compStyleHtItemWrapper = getComputedStyle(htItemWrapper);

    const htFiltersMenuLabel = document.querySelector('.htFiltersMenuLabel');
    const compStyleHtFiltersMenuLabel = getComputedStyle(htFiltersMenuLabel);

    const htUISelectCaption = document.querySelector('.htUISelectCaption');
    const compStyleHtUISelectCaption = getComputedStyle(htUISelectCaption);

    expect(compStyleHtItemWrapper.fontFamily).not.toBe('Helvetica');
    expect(compStyleHtFiltersMenuLabel.fontFamily).not.toBe('Helvetica');
    expect(compStyleHtUISelectCaption.fontFamily).not.toBe('Helvetica');

    bodyStyle.fontFamily = fontFamily;
    bodyStyle.fontSize = fontSize;
  });

  it('should handle locales properly while using search input for Filter by value component', async() => {
    handsontable({
      data: [
        ['Abdulhamit Akkaya'],
        ['Abubekir Kılıç'],
        ['Furkan İnanç'],
        ['Halil İbrahim Öztürk'],
        ['Kaan Yerli'],
        ['Ömer Emin Sarıkoç'],
      ],
      colHeaders: true,
      filters: true,
      dropdownMenu: true,
      locale: 'tr-TR',
    });

    await dropdownMenu(0);
    await sleep(208);

    const inputElement = dropdownMenuRootElement().querySelector('.htUIMultipleSelectSearch input');
    const event = new Event('input', {
      bubbles: true,
      cancelable: true,
    });

    $(inputElement).simulate('mousedown').simulate('mouseup').simulate('click');
    $(inputElement).focus();

    await sleep(208);

    document.activeElement.value = 'inanç';
    document.activeElement.dispatchEvent(event);

    let elements = $(byValueBoxRootElement()).find('label').toArray();
    let text = elements.map(element => $(element).text());

    expect(text).toEqual(['Furkan İnanç']);

    document.activeElement.value = 'İnanç';
    document.activeElement.dispatchEvent(event);

    elements = $(byValueBoxRootElement()).find('label').toArray();
    text = elements.map(element => $(element).text());

    expect(text).toEqual(['Furkan İnanç']);
  });

  it('should handle selection in value box properly', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: true,
      filters: true,
      dropdownMenu: true
    });

    await dropdownMenu(0);
    await sleep(208);

    const inputElement = dropdownMenuRootElement().querySelector('.htUIMultipleSelectSearch input');

    $(inputElement).simulate('mousedown').simulate('mouseup').simulate('click');
    $(inputElement).focus();

    await sleep(208);
    await keyDownUp('arrowdown');

    expect(byValueMultipleSelect().getItemsBox().getSelected()).toEqual([[0, 0, 0, 0]]);

    await keyDownUp('arrowdown');

    expect(byValueMultipleSelect().getItemsBox().getSelected()).toEqual([[1, 0, 1, 0]]);

    await keyDownUp('arrowup');

    expect(byValueMultipleSelect().getItemsBox().getSelected()).toEqual([[0, 0, 0, 0]]);

    $(inputElement).simulate('mousedown').simulate('mouseup').simulate('click');
    $(inputElement).focus();

    expect(byValueMultipleSelect().getItemsBox().getSelected()).toBeUndefined();

    $(inputElement).simulate('mousedown').simulate('mouseup').simulate('click');
    $(inputElement).focus();

    await keyDownUp('tab');

    expect(byValueMultipleSelect().getItemsBox().getSelected()).toBeUndefined();

    $(inputElement).simulate('mousedown').simulate('mouseup').simulate('click');
    $(inputElement).focus();

    await keyDownUp(['shift', 'tab']);

    expect(byValueMultipleSelect().getItemsBox().getSelected()).toBeUndefined();
  });

  it('should inherit the actual layout direction option from the root Handsontable instance to the multiple ' +
    'select component', async() => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      colHeaders: true,
      filters: true,
      dropdownMenu: true,
      layoutDirection: 'inherit',
    });

    await dropdownMenu(0);

    expect(byValueMultipleSelect().getItemsBox().getSettings().layoutDirection).toBe('ltr');
  });

  it('should not throw an error after filtering the dataset when the UI is limited (#dev-1629)', async() => {
    const onErrorSpy = spyOn(window, 'onerror').and.returnValue(true);

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
      filters: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(0);

    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
      .simulate('click');

    expect(onErrorSpy).not.toHaveBeenCalled();
  });

  it('should adjust the dropdown height to the currently displayed content', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(0);

    const initialDropdownHeight = dropdownMenuRootElement().offsetHeight;

    await simulateClick(dropdownMenuRootElement().querySelectorAll('.htUISelect')[0]);
    await selectDropdownByConditionMenuOption('Greater than');

    await sleep(112);

    expect(dropdownMenuRootElement().offsetHeight).toBeGreaterThan(initialDropdownHeight);

    await simulateClick(dropdownMenuRootElement().querySelectorAll('.htUISelect')[0]);
    await selectDropdownByConditionMenuOption('None');

    await sleep(112);

    expect(dropdownMenuRootElement().offsetHeight).toBe(initialDropdownHeight);
  });

  it('should not reset the previous filtering result after opening and accepting the dropdown menu when ' +
     'the action is blocked via `beforeFilter` hook', async() => {
    const beforeFilter = jasmine.createSpy('beforeFilter');

    handsontable({
      data: createSpreadsheetData(5, 5),
      filters: true,
      dropdownMenu: true,
      colHeaders: true,
      beforeFilter,
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(0, 'contains', ['3']);
    plugin.filter();

    beforeFilter.and.returnValue(false);

    await dropdownMenu(1);

    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
      .simulate('click');

    expect(countRows()).toBe(1);
  });

  it('should be possible to scroll the viewport of the "by value" component in both directions', async() => {
    const data = getDataForFilters();

    data[1].name = 'A very long name that should be visible in the component';

    handsontable({
      data,
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(1);

    const byValueScrollableElement = byValueBoxRootElement().querySelector('.ht_master .wtHolder');

    byValueScrollableElement.scrollBy(100, 100);

    expect(byValueScrollableElement.scrollTop).toBe(100);
    expect(byValueScrollableElement.scrollLeft).toBe(100);
  });

  it('should return the focus to the grid after clicking "OK" button', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(1);
    await sleep(112);
    await simulateClick(getFilterDropdownMenuOKButton());

    expect(isListening()).toBe(true);
    expect(getShortcutManager().getActiveContextName()).toBe('grid');
  });

  it('should return the focus to the grid after clicking "Cancel" button', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(1);
    await sleep(112);
    await simulateClick(getFilterDropdownMenuCancelButton());

    expect(isListening()).toBe(true);
    expect(getShortcutManager().getActiveContextName()).toBe('grid');
  });

  describe('Date sorting in "Filter by value" list', () => {
    it('should sort "date" cell type values chronologically in the filter dropdown (not alphabetically)', async() => {
      handsontable({
        data: [
          ['2023-12-15'],
          ['2022-03-01'],
          ['2021-06-20'],
        ],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD' }],
        colHeaders: true,
        dropdownMenu: true,
        filters: true,
        width: 400,
        height: 300,
      });

      await dropdownMenu(0);
      await sleep(112);

      const items = byValueMultipleSelect().getItems();

      expect(items.length).toBe(3);
      // Chronological order: 2021-06-20 < 2022-03-01 < 2023-12-15
      expect(items[0].value).toBe('2021-06-20');
      expect(items[1].value).toBe('2022-03-01');
      expect(items[2].value).toBe('2023-12-15');
    });

    it('should sort "intl-date" cell type values chronologically in the filter dropdown', async() => {
      handsontable({
        data: [
          ['2023-12-15'],
          ['2022-03-01'],
          ['2021-06-20'],
        ],
        columns: [{ type: 'intl-date' }],
        colHeaders: true,
        dropdownMenu: true,
        filters: true,
        width: 400,
        height: 300,
      });

      await dropdownMenu(0);
      await sleep(112);

      const items = byValueMultipleSelect().getItems();

      expect(items.length).toBe(3);
      // Chronological order: 2021-06-20 < 2022-03-01 < 2023-12-15
      expect(items[0].value).toBe('2021-06-20');
      expect(items[1].value).toBe('2022-03-01');
      expect(items[2].value).toBe('2023-12-15');
    });

    it('should place empty values at the top of the "date" column filter list', async() => {
      handsontable({
        data: [
          ['2023-12-15'],
          [null],
          ['2021-06-20'],
        ],
        columns: [{ type: 'date', dateFormat: 'YYYY-MM-DD', allowEmpty: true }],
        colHeaders: true,
        dropdownMenu: true,
        filters: true,
        width: 400,
        height: 300,
      });

      await dropdownMenu(0);
      await sleep(112);

      const items = byValueMultipleSelect().getItems();

      expect(items.length).toBe(3);
      expect(items[0].value).toBe('');
      expect(items[1].value).toBe('2021-06-20');
      expect(items[2].value).toBe('2023-12-15');
    });
  });

  describe('Editing a cell in an earlier filtered column (issue #8874)', () => {
    it('should preserve dependent column "Filter by value" checkboxes when editing earlier filtered column',
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
          colHeaders: true,
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 300,
        });

        const filters = getPlugin('filters');

        filters.addCondition(1, 'by_value', [['Germany', 'France']]);
        filters.filter();
        filters.addCondition(2, 'by_value', [['Mercedes', 'Renault']]);
        filters.filter();

        await setDataAtCell(0, 1, 'France');

        await dropdownMenu(2);
        await sleep(112);

        const items = byValueMultipleSelect().getItems();
        const checkedValues = items.filter(item => item.checked).map(item => item.value);

        expect(checkedValues).toEqual(['Mercedes', 'Renault']);
      });

    it('should preserve dependent column checkboxes when edit reintroduces a filtered-out value (issue repro)',
      async() => {
        handsontable({
          data: [
            { id: 1, country: 'Germany', company: 'BMW' },
            { id: 2, country: 'Germany', company: 'Mercedes' },
            { id: 3, country: 'Germany', company: 'Fiat' },
            { id: 4, country: 'France', company: 'Renault' },
            { id: 5, country: 'Italy', company: 'Ferrari' },
            { id: 6, country: 'France', company: 'Peugeot' },
            { id: 7, country: 'Italy', company: 'Lamborghini' },
            { id: 8, country: 'Germany', company: 'Audi' },
          ],
          columns: [
            { data: 'id', type: 'numeric' },
            { data: 'country' },
            { data: 'company' },
          ],
          colHeaders: true,
          dropdownMenu: true,
          filters: true,
          width: 500,
          height: 360,
        });

        const filters = getPlugin('filters');

        filters.addCondition(1, 'by_value', [['Germany', 'France']]);
        filters.filter();
        filters.addCondition(2, 'by_value',
          [['Mercedes', 'Fiat', 'Renault', 'Ferrari', 'Peugeot', 'Lamborghini', 'Audi']]);
        filters.filter();

        await setDataAtCell(2, 1, 'Italy');

        await dropdownMenu(2);
        await sleep(112);

        const items = byValueMultipleSelect().getItems();
        const checkedValues = items.filter(item => item.checked).map(item => item.value);

        expect(checkedValues).toEqual(
          jasmine.arrayWithExactContents(['Mercedes', 'Fiat', 'Renault', 'Ferrari', 'Peugeot', 'Lamborghini', 'Audi']));
      });
  });
});
