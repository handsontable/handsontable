import {
  getDataForFilters,
  getColumnsForFilters,
} from '../helpers/fixtures';

describe('Filters condition component input type', () => {
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

  const getConditionInput = (index = 0) => {
    return dropdownMenuRootElement().querySelectorAll('.htFiltersMenuCondition .htUIInput input')[index];
  };

  it('should render a native date input after selecting the "Before" condition on a date column', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(3);
    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('Before');
    await sleep(50);

    expect(getConditionInput(0).type).toBe('date');
  });

  it('should render a native date input for the "After", "Before or equal to" and ' +
     '"After or equal to" conditions on a date column', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    const conditions = ['After', 'Before or equal to', 'After or equal to'];

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < conditions.length; i++) {
      await dropdownMenu(3);
      await openDropdownByConditionMenu();
      await selectDropdownByConditionMenuOption(conditions[i]);
      await sleep(50);

      expect(getConditionInput(0).type).toBe('date');

      await keyDownUp('escape');
    }
    /* eslint-enable no-await-in-loop */
  });

  it('should keep the text input for conditions without a declared input type', async() => {
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
    await selectDropdownByConditionMenuOption('Contains');
    await sleep(50);

    expect(getConditionInput(0).type).toBe('text');
  });

  it('should render a native date input for an intl-date column', async() => {
    handsontable({
      data: [
        { name: 'Vine', delivery: '2023-03-01' },
        { name: 'Fig', delivery: '2023-03-05' },
      ],
      columns: [
        { data: 'name', type: 'text', title: 'Name' },
        { data: 'delivery', type: 'intl-date', title: 'Delivery', dateFormat: { dateStyle: 'short' } },
      ],
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(1);
    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('Before');
    await sleep(50);

    expect(getConditionInput(0).type).toBe('date');
  });

  it('should render a native time input for an intl-time column', async() => {
    handsontable({
      data: [
        { name: 'Vine', delivery: '10:30' },
        { name: 'Fig', delivery: '16:45' },
      ],
      columns: [
        { data: 'name', type: 'text', title: 'Name' },
        { data: 'delivery', type: 'intl-time', title: 'Delivery', timeFormat: { timeStyle: 'short' } },
      ],
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(1);
    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('Before');
    await sleep(50);

    expect(getConditionInput(0).type).toBe('time');
  });

  it('should filter rows when the date is set through the native input without any key press ' +
     '(value picked from the date picker fires only `input`/`change` events)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(3);
    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('Before');
    await sleep(50);

    const input = getConditionInput(0);

    input.value = '2014-12-08';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'))
      .simulate('click');

    // Only '2014-01-29' (id=1) and '2014-01-08' (id=8) are strictly before '2014-12-08'.
    const ids = getData().map(row => row[0]);

    expect(ids).toContain(1);
    expect(ids).toContain(8);
    expect(ids).not.toContain(2);
  });

  it('should restore the date input type and value when reopening the menu with a saved condition', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    const plugin = getPlugin('filters');

    plugin.addCondition(3, 'date_before', ['2015-04-11']);
    await plugin.filter();

    await dropdownMenu(3);
    await sleep(50);

    const input = getConditionInput(0);

    expect(input.type).toBe('date');
    expect(input.value).toBe('2015-04-11');
  });

  it('should switch the input type back to text when the menu is reused on a text column', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    await dropdownMenu(3);
    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('Before');
    await sleep(50);

    expect(getConditionInput(0).type).toBe('date');

    await keyDownUp('escape');

    await dropdownMenu(1);
    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('Contains');
    await sleep(50);

    expect(getConditionInput(0).type).toBe('text');
  });
});
