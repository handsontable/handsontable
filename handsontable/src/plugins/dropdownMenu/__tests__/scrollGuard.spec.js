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

  it('should block delayed horizontal viewport scroll after opening menu from a partially visible header button', async() => {
    handsontable({
      data: createSpreadsheetData(10, 20),
      width: 300,
      height: 300,
      colWidths: 100,
      colHeaders: true,
      rowHeaders: true,
      dropdownMenu: true
    });

    await scrollViewportTo({ row: 0, col: 8 }); // make the column `G` partially visible

    const initialScrollPosition = inlineStartOverlay().getScrollPosition();

    await dropdownMenu(6);

    expect(getPlugin('dropdownMenu').menu.isOpened()).toBe(true);

    await scrollViewportTo({ row: 0, col: 6, horizontalSnap: 'start' });

    expect(inlineStartOverlay().getScrollPosition()).toBe(initialScrollPosition);

    getPlugin('dropdownMenu').close();

    await scrollViewportTo({ row: 0, col: 6, horizontalSnap: 'start' });

    expect(inlineStartOverlay().getScrollPosition()).not.toBe(initialScrollPosition);
  });
});
