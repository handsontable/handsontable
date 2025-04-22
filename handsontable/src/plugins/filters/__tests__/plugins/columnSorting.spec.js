describe('Filters UI cooperation with ColumnSorting', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should filter values when sorting is applied', async() => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      columnSorting: true,
      width: 500,
      height: 300
    });

    dropdownMenu(0);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Greater than');

    await sleep(200);

    // Greater than 12
    document.activeElement.value = '12';
    keyUp('2');
    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

    // sort
    getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
    getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
    getHtCore().find('th span.columnSorting:eq(2)').simulate('click');

    dropdownMenu(2);
    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Begins with');

    await sleep(200);

    // Begins with 'b'
    document.activeElement.value = 'b';
    keyUp('b');
    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

    await sleep(10);

    expect(getData().length).toEqual(3);
    expect(getData()[0][0]).toBe(24);
    expect(getData()[1][0]).toBe(17);
    expect(getData()[2][0]).toBe(14);
  });

  it('should correctly remove rows from filtered values when sorting is applied', (done) => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      columnSorting: true,
      width: 500,
      height: 300
    });

    setTimeout(() => {
      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Greater than');
    }, 300);

    setTimeout(() => {
      // Greater than 12

      $(conditionSelectRootElements().first).next().find('input')[0].focus();

      document.activeElement.value = '12';
      keyUp('2');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      // sort
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
      alter('remove_row', 1, 5);

      dropdownMenu(2);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Ends with');
    }, 600);

    setTimeout(() => {
      // Ends with 'e'

      $(conditionSelectRootElements().first).next().find('input')[0].focus();

      document.activeElement.value = 'e';
      keyUp('e');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(7);
      expect(getDataAtCol(0).join()).toBe('24,16,23,32,26,28,21');

      alter('remove_row', 1, 5);

      expect(getData().length).toEqual(2);
      expect(getDataAtCol(0).join()).toBe('24,21');

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('None');
    }, 900);

    setTimeout(() => {
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toEqual(5);
      expect(getDataAtCol(0).join()).toBe('1,6,10,24,21'); // Elements 1, 6, 10 haven't been sorted.
      done();
    }, 1200);
  });

  it('should correctly insert rows into filtered values when sorting is applied', (done) => {
    handsontable({
      data: getDataForFilters(),
      columns: getColumnsForFilters(),
      dropdownMenu: true,
      filters: true,
      columnSorting: true,
      width: 500,
      height: 300
    });

    setTimeout(() => {
      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Greater than');
    }, 300);

    setTimeout(() => {
      // Greater than 12

      $(conditionSelectRootElements().first).next().find('input')[0].focus();

      document.activeElement.value = '12';
      keyUp('2');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      // sort
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mousedown');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('mouseup');
      getHtCore().find('th span.columnSorting:eq(2)').simulate('click');
      alter('insert_row_above', 1, 5);

      dropdownMenu(2);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Ends with');
    }, 600);

    setTimeout(() => {
      // Ends with 'e'

      $(conditionSelectRootElements().first).next().find('input')[0].focus();

      document.activeElement.value = 'e';
      keyUp('e');
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toBe(9);
      expect(getDataAtCol(0).join()).toBe('24,17,14,16,23,32,26,28,21');

      alter('insert_row_above', 1, 1);

      expect(getData().length).toBe(10);
      expect(getDataAtCol(0).join()).toBe('24,,17,14,16,23,32,26,28,21');

      dropdownMenu(0);
      openDropdownByConditionMenu();
      selectDropdownByConditionMenuOption('Is empty');
    }, 900);

    setTimeout(() => {
      $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

      expect(getData().length).toBe(0);
      done();
    }, 1200);
  });
});
