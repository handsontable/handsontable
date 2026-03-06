describe('DropdownMenu', () => {
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

  it('should be possible to close the context menu when tapping outside of the Handsontable instance', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      width: 600,
      height: 400,
      dropdownMenu: true,
    });

    await dropdownMenu(0);

    expect($('.htDropdownMenu').is(':visible')).toBe(true);

    await simulateTouch(document.body);

    expect($('.htDropdownMenu').is(':visible')).toBe(false);
  });

  it('should be possible to close the context menu when tapping on a cell inside the main Handsontable instance ' +
    '(dev-handsontable#1931)', async() => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      width: 600,
      height: 400,
      dropdownMenu: true,
    });

    await dropdownMenu(0);

    expect($('.htDropdownMenu').is(':visible')).toBe(true);

    await simulateTouch(getCell(3, 3));

    expect($('.htDropdownMenu').is(':visible')).toBe(false);
  });
});
