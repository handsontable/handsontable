describe('Filters metadata and tree-shaking (#12165)', () => {
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

  it('should not throw an error while selecting "Is equal to" condition', async() => {
    const onErrorSpy = spyOn(window, 'onerror').and.returnValue(true);

    handsontable({
      data: createSpreadsheetData(10, 5),
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
    });

    await dropdownMenu(0);
    await openDropdownByConditionMenu();
    await selectDropdownByConditionMenuOption('Is equal to');

    expect(onErrorSpy).not.toHaveBeenCalled();
  });
});
