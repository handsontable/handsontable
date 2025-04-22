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

  it('should be possible to close the context menu when tapping outside of the Handsontable instance', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      width: 600,
      height: 400,
      dropdownMenu: true,
    });

    dropdownMenu(0);

    expect($('.htDropdownMenu').is(':visible')).toBe(true);

    simulateTouch(document.body);

    expect($('.htDropdownMenu').is(':visible')).toBe(false);
  });

  it('should be possible to close the context menu when tapping on a cell inside the main Handsontable instance ' +
    '(dev-handsontable#1931)', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      width: 600,
      height: 400,
      dropdownMenu: true,
    });

    dropdownMenu(0);

    expect($('.htDropdownMenu').is(':visible')).toBe(true);

    simulateTouch(getCell(3, 3));

    expect($('.htDropdownMenu').is(':visible')).toBe(false);
  });
});
