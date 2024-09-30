describe('Filters UI cooperation with HiddenColumn', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should display proper values after opening dropdown menu', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      dropdownMenu: true,
      filters: true,
      hiddenColumns: {
        columns: [0],
      },
      colHeaders: true,
      rowHeaders: true
    });

    dropdownMenu(0);

    await sleep(200);

    const elements = $(byValueBoxRootElement()).find('label').toArray();
    const text = elements.map(element => $(element).text());

    expect(text).toEqual(['B1', 'B2', 'B3', 'B4', 'B5']);

    openDropdownByConditionMenu();
    selectDropdownByConditionMenuOption('Begins with');

    await sleep(200);

    // Begins with 'b'
    document.activeElement.value = 'b';
    keyUp('b');
    $(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input')).simulate('click');

    expect(spec().$container.find('th:eq(1)').hasClass('htFiltersActive')).toEqual(true);
  });
});
