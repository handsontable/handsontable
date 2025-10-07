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

    await sleep(100);

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
    await sleep(100);

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

    await sleep(100);

    $(dropdownMenuRootElement().querySelector('.htUIClearAll a')).simulate('click');

    await sleep(200);

    expect(byValueMultipleSelect().getItems().map(o => o.checked).indexOf(true)).toBe(-1);

    await scrollWindowBy(0, 9500);

    await sleep(200);

    await scrollWindowBy(0, -9500);

    await sleep(200);

    multipleSelectElement.querySelector('.handsontable .wtHolder').scrollBy(0, 10);

    await sleep(200);

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

    await sleep(200);

    // Contains '2'
    document.activeElement.value = '2';
    await keyUp('2');

    await simulateClick(dropdownMenuRootElement().querySelectorAll('.htUISelect')[1]);
    await selectDropdownByConditionMenuOption('Contains', 'second');

    await sleep(200);

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
      await sleep(200);

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
      await sleep(200);

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
      expect(getData()[0][3]).toBe(moment().add(-1, 'days').format(FILTERS_DATE_FORMAT));
      expect(getData()[0][4]).toBe('green');
      expect(getData()[0][5]).toBe(3592.18);
      expect(getData()[0][6]).toBe(false);
      expect(getDataAtCol(3).join()).toBe([
        moment().add(-1, 'days').format(FILTERS_DATE_FORMAT),
        moment().add(-1, 'days').format(FILTERS_DATE_FORMAT),
        moment().add(-1, 'days').format(FILTERS_DATE_FORMAT),
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

      await dropdownMenu(6);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Contains');

      await sleep(200);

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
      await sleep(200);

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
      await sleep(200);

      // Is equal to '5'
      document.activeElement.value = '5';

      await keyUp('5');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(1);

      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Less than');
      await sleep(200);

      // Less than
      document.activeElement.value = '8';

      await keyUp('8');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

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

      await sleep(200);

      // Less than
      document.activeElement.value = '8';

      await keyUp('8');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toBe(7);

      await selectCell(3, 0);
      await keyDownUp('enter');

      document.activeElement.value = '99';

      await keyDownUp('enter');
      await sleep(200);
      await dropdownMenu(0);

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

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
      await sleep(200);

      byValueMultipleSelect().setValue(['Bowie', 'Coral']);
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(2);
      await sleep(200);

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

      await sleep(100);

      // Greater than 12
      document.activeElement.value = '12';

      await keyUp('2');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(2);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');
      await sleep(100);

      document.activeElement.value = 'b';

      await keyUp('b');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      // this condition needs extra time to apply filters
      await sleep(10);
      await dropdownMenu(4);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Is equal to');
      await sleep(100);

      document.activeElement.value = 'green';

      await keyUp('n');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

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
      await sleep(200);

      // Greater than 12
      document.activeElement.value = '12';

      await keyUp('2');
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await dropdownMenu(2);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');
      await sleep(200);

      document.activeElement.value = 'b';
      await keyUp('b');
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await dropdownMenu(4);
      // uncheck first record
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));

      await sleep(200);
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await sleep(10);

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

      await sleep(200);

      // Greater than 12
      document.activeElement.value = '12';

      await keyUp('2');
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await dropdownMenu(2);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Begins with');

      await sleep(200);

      document.activeElement.value = 'b';

      await keyUp('b');
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      // Change first added filter condition. First added condition is responsible for defining data root chain.
      await dropdownMenu(0);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption('Is between');

      await sleep(200);
      const inputs = dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition input');

      inputs[0].value = '1';
      inputs[1].value = '15';
      await keyUp('1', { target: inputs[0] });
      await keyUp('5', { target: inputs[1] });
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await sleep(10);

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

      await sleep(200);

      // Greater than 25
      document.activeElement.value = '25';
      await keyUp('5');
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await dropdownMenu(2);
      await sleep(200);

      // uncheck
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(3) [type=checkbox]'));
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(4) [type=checkbox]'));
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await dropdownMenu(1);
      await sleep(200);

      // uncheck
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(2) [type=checkbox]'));
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      expect(byValueMultipleSelect().getItems().length).toBe(11);
      expect(byValueMultipleSelect().getValue().length).toBe(9);

      await dropdownMenu(4);
      await sleep(200);

      // uncheck
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(2) [type=checkbox]'));
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      expect(byValueMultipleSelect().getItems().length).toBe(3);
      expect(byValueMultipleSelect().getValue().length).toBe(1);

      await dropdownMenu(2);
      await sleep(200);

      // check again (disable filter)
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(3) [type=checkbox]'));
      await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(4) [type=checkbox]'));
      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      await dropdownMenu(1);
      await sleep(200);

      expect(byValueMultipleSelect().getItems().length).toBe(14);
      expect(byValueMultipleSelect().getValue().length).toBe(9);

      await dropdownMenu(4);
      await sleep(200);

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

      await sleep(200);
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

      await sleep(300);

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

      await sleep(200);

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
      await sleep(300);

      document.activeElement.value = 'm';

      await keyUp('m');

      // conjunction
      $(conditionRadioInput(1).element).find('input[type="radio"]').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(1);
      await sleep(300);

      expect(getData().length).toBe(5);

      // disjunction
      $(conditionRadioInput(0).element).find('input[type="radio"]').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(300);

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

      await sleep(300);

      document.activeElement.value = 'm';

      await keyUp('m');

      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');

      await sleep(300);

      document.activeElement.value = 'e';

      await keyUp('e');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toBe(3);

      await dropdownMenu(1);
      await sleep(300);

      // disjunction
      $(conditionRadioInput(1).element).find('input[type="radio"]').simulate('click');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
      expect(getData().length).toBe(7);

      await dropdownMenu(1);
      await sleep(300);
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

      await sleep(200);

      document.activeElement.value = 'm';

      await keyUp('m');
      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');
      await sleep(200);

      document.activeElement.value = 'e';

      await keyUp('e');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(200);
      await dropdownMenu(1);
      await sleep(200);

      document.activeElement.value = '';

      await keyUp('Backspace');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(200);

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

      await sleep(300);

      document.activeElement.value = 'm';

      await keyUp('m');
      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');
      await sleep(300);

      document.activeElement.value = 'e';

      await keyUp('e');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(300);
      await dropdownMenu(1);
      await sleep(300);

      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('None', 'second');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(300);

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
      await sleep(200);

      document.activeElement.value = 'm';

      await keyUp('m');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toBe(5);

      await dropdownMenu(1);
      await sleep(200);

      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.eq(0).simulate('click');
      // disjunction
      $(conditionRadioInput(1).element).find('input[type="radio"]').simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

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

      await sleep(200);

      document.activeElement.value = 'm';

      await keyUp('m');
      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');
      await sleep(200);

      document.activeElement.value = 'e';

      await keyUp('e');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(1);
      await sleep(200);

      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.eq(0).simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

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

      await sleep(200);

      document.activeElement.value = 'm';

      await keyUp('m');
      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');
      await sleep(200);

      document.activeElement.value = 'e';

      await keyUp('e');

      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      // Alice Blake
      $multipleSelectElements.eq(0).simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toBe(3);
    });

    it.forTheme('classic')('Two conditionals chosen & unchecked value which won\'t be filtered ' +
      'by conditions -> filter operation', async() => {
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
      await sleep(200);

      document.activeElement.value = 'm';

      await keyUp('m');

      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');
      await sleep(200);

      document.activeElement.value = 'e';

      await keyUp('e');

      let $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.get(4).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(8).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(12).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(13).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));

      // Mathis Boone, 23th element
      $multipleSelectElements.eq(9).simulate('click');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toBe(2);
    });

    it.forTheme('main')('Two conditionals chosen & unchecked value which won\'t be filtered ' +
      'by conditions -> filter operation', async() => {
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
      await sleep(200);

      document.activeElement.value = 'm';

      await keyUp('m');
      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');
      await sleep(200);

      document.activeElement.value = 'e';

      await keyUp('e');

      let $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.get(4).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(8).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(12).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(13).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));

      // Mathis Boone, 23th element
      $multipleSelectElements.eq(9).simulate('click');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

      expect(getData().length).toBe(2);
    });

    it.forTheme('horizon')('Two conditionals chosen & unchecked value which won\'t be filtered ' +
      'by conditions -> filter operation', async() => {
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
      await sleep(200);

      document.activeElement.value = 'm';

      await keyUp('m');
      await openDropdownByConditionMenu('second');
      await selectDropdownByConditionMenuOption('Ends with', 'second');

      await sleep(200);

      document.activeElement.value = 'e';

      await keyUp('e');

      let $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.get(3).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(6).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(9).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(10).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));
      $multipleSelectElements.get(13).scrollIntoView();

      $multipleSelectElements = $(byValueMultipleSelect().element.querySelectorAll('.htUIMultipleSelectHot td input'));

      // Mathis Boone, 23th element
      $multipleSelectElements.eq(12).simulate('click');

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await sleep(10);

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
      await sleep(200);

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
      await sleep(200);

      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(1);
      await sleep(200);

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
      await sleep(200);

      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.eq(0).simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(1);
      await sleep(200);

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
      await sleep(200);

      const $multipleSelectElements = $(byValueMultipleSelect().element
        .querySelectorAll('.htUIMultipleSelectHot td input'));

      $multipleSelectElements.eq(0).simulate('click');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      await dropdownMenu(1);
      await sleep(200);

      expect($(conditionSelectRootElements().first).text()).toEqual('Begins with');
      expect($(conditionSelectRootElements().second).text()).toEqual('Ends with');

      // original state (now performing `disjunctionWithExtraCondition` operation)
      expect($(conditionRadioInput(0).element).parent().find(':checked').parent().text()).toEqual('Or');
      expect(getData().length).toEqual(dateLength - 1);
    });
  });

  describe('searchMode', () => {
    it('should apply filters for all filtered items from the list when searchMode is `show`', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: {
          searchMode: 'show'
        },
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(2);

      byValueMultipleSelect().element.querySelector('input').focus();

      await sleep(200);

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

    it('should apply filters for all filtered items from the list when searchMode is `show` some checkboxes are unchecked', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: {
          searchMode: 'show'
        },
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(2);

      $(dropdownMenuRootElement().querySelector('.htUIClearAll a')).simulate('click');

      byValueMultipleSelect().element.querySelector('input').focus();

      await sleep(200);

      const event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });

      document.activeElement.value = 'ca';
      document.activeElement.dispatchEvent(event);

      const $multipleSelectElements = $('.htUIMultipleSelectHot td input');

      $multipleSelectElements.eq(1).simulate('click');

      await sleep(200);

      await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      expect(getData()[0][2]).toBe('Canby');
      expect(getData().length).toBe(1);
    });

    it('should apply the filter when the input is focused and Enter is pressed when searchMode is `show`', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        filters: {
          searchMode: 'show'
        },
        dropdownMenu: true,
        width: 500,
        height: 300
      });

      await dropdownMenu(2);

      byValueMultipleSelect().element.querySelector('input').focus();

      await sleep(200);

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
    await sleep(200);

    const inputElement = dropdownMenuRootElement().querySelector('.htUIMultipleSelectSearch input');
    const event = new Event('input', {
      bubbles: true,
      cancelable: true,
    });

    $(inputElement).simulate('mousedown').simulate('mouseup').simulate('click');
    $(inputElement).focus();

    await sleep(200);

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
    await sleep(200);

    const inputElement = dropdownMenuRootElement().querySelector('.htUIMultipleSelectSearch input');

    $(inputElement).simulate('mousedown').simulate('mouseup').simulate('click');
    $(inputElement).focus();

    await sleep(200);
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

    await sleep(100);

    expect(dropdownMenuRootElement().offsetHeight).toBeGreaterThan(initialDropdownHeight);

    await simulateClick(dropdownMenuRootElement().querySelectorAll('.htUISelect')[0]);
    await selectDropdownByConditionMenuOption('None');

    await sleep(100);

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
});
