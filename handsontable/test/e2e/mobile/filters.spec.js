const id = 'testContainer';

describe('Filters', () => {
  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    window.resizeTo(390, 840);
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should keep focus on the input when the filter search input is clicked', async() => {
    handsontable({
      data: createSpreadsheetObjectData(3, 3),
      filters: true,
      colHeaders: true,
      dropdownMenu: true,
    });

    const button = getCell(-1, 0).querySelector('.changeType');

    await simulateTouch(button);

    const plugin = getPlugin('dropdownMenu');
    const input = plugin.menu.container.querySelector('.htUIMultipleSelectSearch input');

    await simulateTouch(input);

    Object.defineProperty(window, 'innerWidth', { value: 390 });
    Object.defineProperty(window, 'innerHeight', { value: 600 });

    window.dispatchEvent(new Event('resize'));

    await sleep(100);

    expect(document.activeElement).toBe(input);
  });
});
