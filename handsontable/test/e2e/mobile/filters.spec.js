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
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(3, 3),
      filters: true,
      colHeaders: true,
      dropdownMenu: true,
    });

    const th = hot.view._wt.wtTable.getColumnHeader(0);
    const button = th.querySelector('.changeType');

    simulateTouch(button);

    const plugin = hot.getPlugin('dropdownMenu');
    const input = plugin.menu.container.querySelector('.htUIMultipleSelectSearch input');

    simulateTouch(input);

    if (Handsontable.helper.isAndroid()) {
      Object.defineProperty(window, 'innerWidth', { value: 390 });
      Object.defineProperty(window, 'innerHeight', { value: 600 });

      window.dispatchEvent(new Event('resize'));
    }

    await sleep(100);

    expect(document.activeElement).toBe(input);
  });
});
