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

  it('should not display [object Object] in the filter-by-value list for key-value dropdown data after edit #12005', async() => {
    const source = [
      { key: 'LAX', value: 'Los Angeles International Airport' },
      { key: 'JFK', value: 'John F. Kennedy International Airport' },
      { key: 'ORD', value: 'Chicago O\'Hare International Airport' },
    ];
    const data = [
      { airport: { ...source[0] } },
      { airport: { ...source[1] } },
      { airport: { ...source[2] } },
    ];

    handsontable({
      data,
      columns: [
        {
          data: 'airport',
          type: 'dropdown',
          source,
        },
      ],
      filters: true,
      colHeaders: true,
      dropdownMenu: true,
    });

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(0, 'by_value', [[source[0].value]]);
    filtersPlugin.filter();

    await setDataAtCell(0, 0, source[1].value, 'edit');

    const button = getCell(-1, 0).querySelector('.changeType');

    await simulateTouch(button);

    const values = Array.from(
      getPlugin('dropdownMenu').menu.container.querySelectorAll('.htUIMultipleSelectHot .htCore td:last-child')
    ).map(cell => cell.textContent);

    expect(values).toContain(source[1].value);
    expect(values).toContain(source[2].value);
    expect(values).not.toContain('[object Object]');
  });
});
