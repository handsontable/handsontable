describe('Filters UI Value component', () => {
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

    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuValue .htFiltersMenuLabel').textContent)
      .toBe('Filter by value:');
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuValue .htUIMultipleSelect')).not.toBeNull();

    await sleep(300);

    // The filter components should be intact after some time. These expectations check whether the GhostTable
    // does not steal the components' element while recalculating column width (PR #5555).
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuValue .htFiltersMenuLabel').textContent)
      .toBe('Filter by value:');
    expect(dropdownMenuRootElement().querySelector('.htFiltersMenuValue .htUIMultipleSelect')).not.toBeNull();
  });

  it('should appear an empty list when the dropdown is opened using API and the table has no selection', () => {
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

    expect(byValueMultipleSelect().element.querySelectorAll('.htCore td').length).toBe(0);
  });

  it('should appear a list from the column selected by the selection highlight when the dropdown is opened ' +
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

    expect(byValueMultipleSelect().element.querySelectorAll('.htCore td').length).forThemes(({ classic, main }) => {
      classic.toBe(7);
      main.toBe(6);
    });
    expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('2014-01-08');
  });

  it('should not scroll the view after selecting the item (test for checking if the event bubbling is not blocked, #6497)', async() => {
    handsontable({
      data: getDataForFilters().slice(0, 15),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300
    });

    dropdownMenu(2);

    await sleep(200);

    $(byValueBoxRootElement()).find('tr:nth-child(1) :checkbox')
      .simulate('mousedown')
      .simulate('mouseup')
      .simulate('click');

    expect($(byValueBoxRootElement()).find('.ht_master .wtHolder').scrollTop()).toBe(0);

    $(byValueBoxRootElement()).find('tr:nth-child(5) :checkbox').simulate('mouseover');
    $(byValueBoxRootElement()).find('tr:nth-child(6) :checkbox').simulate('mouseover');
    $(byValueBoxRootElement()).find('tr:nth-child(7) :checkbox').simulate('mouseover');

    await sleep(200);

    expect($(byValueBoxRootElement()).find('.ht_master .wtHolder').scrollTop()).toBe(0);
  });

  it('should display empty values as "(Blank cells)"', () => {
    const data = getDataForFilters();

    data[3].name = '';

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);

    expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('Alice Blake');

    loadData(data);
    dropdownMenu(1);

    expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('(Blank cells)');
  });

  it('should display `null` values as "(Blank cells)"', () => {
    const data = getDataForFilters();

    data[3].name = null;

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);

    expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('Alice Blake');

    loadData(data);
    dropdownMenu(1);

    expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('(Blank cells)');
  });

  it('should display `undefined` values as "(Blank cells)"', () => {
    const data = getDataForFilters();

    data[3].name = undefined;

    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);

    expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('Alice Blake');

    loadData(data);
    dropdownMenu(1);

    expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('(Blank cells)');
  });

  it.forTheme('classic')('should utilize the `modifyFiltersMultiSelectValue` hook to display the cell value', () => {
    const columnsSetting = getColumnsForFilters();

    handsontable({
      data: getDataForFilters(),
      columns: columnsSetting,
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300,
      modifyFiltersMultiSelectValue: (value) => {
        return `Pre ${value}`;
      },
    });

    dropdownMenu(1);

    const unifiedColDataSample = [
      'Alice Blake', 'Alyssa Francis', 'Becky Ross', 'Bridges Sawyer', 'Burt Cash', 'Carissa Villarreal'
    ];

    for (let i = 0; i < unifiedColDataSample.length; i++) {
      expect(
        byValueMultipleSelect().element.querySelectorAll('.htCore td')[i].textContent
      ).toBe(`Pre ${unifiedColDataSample[i]}`);
    }
    expect(unifiedColDataSample.length).toBe(6);
  });

  it.forTheme('main')('should utilize the `modifyFiltersMultiSelectValue` hook to display the cell value', () => {
    const columnsSetting = getColumnsForFilters();

    handsontable({
      data: getDataForFilters(),
      columns: columnsSetting,
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300,
      modifyFiltersMultiSelectValue: (value) => {
        return `Pre ${value}`;
      },
    });

    dropdownMenu(1);

    const unifiedColDataSample = [
      'Alice Blake', 'Alyssa Francis', 'Becky Ross', 'Bridges Sawyer', 'Burt Cash',
    ];

    for (let i = 0; i < unifiedColDataSample.length; i++) {
      expect(
        byValueMultipleSelect().element.querySelectorAll('.htCore td')[i].textContent
      ).toBe(`Pre ${unifiedColDataSample[i]}`);
    }
    expect(unifiedColDataSample.length).toBe(5);
  });

  it('should display the formatted renderer output in the multi-selection component if the column being filtered ' +
    'is numeric-typed', () => {
    handsontable({
      data: [
        [1, 6],
        [2, 7],
        [3, 8],
        [4, 9],
        [5, 10],
      ],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      columns: [
        {},
        {
          type: 'numeric',
          numericFormat: {
            pattern: '$0,0.00',
          }
        }
      ]
    });

    dropdownMenu(1);

    for (let i = 0; i < countRows(); i++) {
      expect(
        byValueMultipleSelect().element.querySelectorAll('.htCore td')[i].textContent
      ).toBe(`$${getDataAtCell(i, 1)}.00`);
    }
  });

  it('shouldn\'t break "by value" items in the next filter stacks', async() => {
    const data = getDataForFilters();

    data[3].name = undefined;

    handsontable({
      data,
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);

    await sleep(200);

    // deselect "(Blank cells)"
    $(byValueMultipleSelect().element.querySelector('.htUIMultipleSelectHot td input')).simulate('click');
    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
    dropdownMenu(2);

    await sleep(200);

    // deselect "Alamo"
    $(byValueMultipleSelect().element.querySelector('.htUIMultipleSelectHot td input')).simulate('click');
    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
    dropdownMenu(1);

    await sleep(200);

    // select "(Blank cells)"
    $(byValueMultipleSelect().element.querySelector('.htUIMultipleSelectHot td input')).simulate('click');
    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');
    dropdownMenu(2);

    await sleep(200);

    expect(byValueMultipleSelect().element.querySelector('.htCore td').textContent).toBe('Alamo');
  });

  it('should disappear after hitting ESC key (focused search input)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);
    byValueMultipleSelect().element.querySelector('input').focus();

    await sleep(200);

    keyDownUp('escape');

    expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
    expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
  });

  it('should disappear after hitting ESC key (focused items box)', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      filters: true,
      dropdownMenu: true,
      width: 500,
      height: 300
    });

    dropdownMenu(1);

    await sleep(200);

    byValueMultipleSelect().focus();
    keyDownUp('escape');
    expect($(conditionMenuRootElements().first).is(':visible')).toBe(false);
    expect($(dropdownMenuRootElement()).is(':visible')).toBe(false);
  });

  describe('Updating "by value" component cache #87', () => {
    it('should update component view after applying filtering and changing cell value', () => {
      handsontable({
        data: [
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'AAA City'
          },
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'BBB City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'CCC City'
          },
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

      dropdownMenu(2);

      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));
      setDataAtCell(0, 2, 'BBB City - modified');

      dropdownMenu(2);
      expect($(byValueBoxRootElement()).find('tr:contains("BBB City - modified")').length).toEqual(1);

      const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
      const checkedArray = checkboxes.map(element => element.checked);

      expect(checkedArray).toEqual([false, true, true]);
    });

    it('should not modify checkboxes if the user changed values in another column', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 2),
        dropdownMenu: true,
        colHeaders: true,
        filters: true,
      });

      const filters = hot.getPlugin('Filters');

      filters.addCondition(0, 'by_value', [['A2', 'A3', 'A4', 'A5']]);
      filters.filter();
      hot.selectCell(0, 1);
      hot.emptySelectedCells();

      dropdownMenu(0);

      const checkboxes = $(byValueBoxRootElement()).find(':checkbox');

      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(true);
      expect(checkboxes[2].checked).toBe(true);
      expect(checkboxes[3].checked).toBe(true);
      expect(checkboxes[4].checked).toBe(true);
    });

    it('should show proper number of values after refreshing cache ' +
      '(should remove the value from component), case nr 1 (changing value to match unfiltered value)', () => {
      handsontable({
        data: [
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'AAA City'
          },
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'BBB City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'CCC City'
          },
          {
            id: 4,
            name: 'Heather Mcdaniel',
            address: 'DDD City'
          }
        ],
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });

      dropdownMenu(2);

      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      setDataAtCell(0, 2, 'CCC City'); // BBB City -> CCC City
      dropdownMenu(2);

      const elements = $(byValueBoxRootElement()).find('label').toArray();
      const text = elements.map(element => $(element).text());

      expect(text).toEqual(['AAA City', 'CCC City', 'DDD City']);

      const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
      const checkedArray = checkboxes.map(element => element.checked);

      expect(checkedArray).toEqual([false, true, true]);
    });

    it('should show proper number of values after refreshing cache ' +
      '(should remove the value from component), case nr 2 (changing value to match filtered value)', (done) => {
      handsontable({
        data: [
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'AAA City'
          },
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'AAAA City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'CCC City'
          },
          {
            id: 4,
            name: 'Heather Mcdaniel',
            address: 'DDD City'
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

      dropdownMenu(2);

      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      setDataAtCell(0, 2, 'AAA City'); // AAAA City -> AAA City

      dropdownMenu(2);
      const elements = $(byValueBoxRootElement()).find('label').toArray();
      const text = elements.map(element => $(element).text());

      expect(text).toEqual(['AAA City', 'CCC City', 'DDD City']);
      done();
    });

    it('should show proper number of values after refreshing cache (should add new value to component)', () => {
      handsontable({
        data: [
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'AAA City'
          },
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'BBB City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'BBB City'
          },
          {
            id: 4,
            name: 'Heather Mcdaniel',
            address: 'DDD City'
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

      dropdownMenu(2);

      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      setDataAtCell(1, 2, 'CCC City');
      dropdownMenu(2);

      const elements = $(byValueBoxRootElement()).find('label').toArray();
      const text = elements.map(element => $(element).text());

      expect(text).toEqual(['AAA City', 'BBB City', 'CCC City', 'DDD City']);

      const checkboxes = $(byValueBoxRootElement()).find(':checkbox').toArray();
      const checkedArray = checkboxes.map(element => element.checked);

      expect(checkedArray).toEqual([false, true, true, true]);
    });

    it('should sort updated values', () => {
      handsontable({
        data: [
          {
            id: 1,
            name: 'Nannie Patel',
            address: 'BBB City'
          },
          {
            id: 2,
            name: 'Leanne Ware',
            address: 'ZZZ City'
          },
          {
            id: 3,
            name: 'Mathis Boone',
            address: 'CCC City'
          },
          {
            id: 4,
            name: 'Heather Mcdaniel',
            address: 'DDD City'
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

      dropdownMenu(2);

      simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
      simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

      setDataAtCell(0, 2, 'AAA City');

      dropdownMenu(2);
      expect($(byValueBoxRootElement()).find('tr:nth-child(1)').text()).toEqual('AAA City');
    });
  });
});
