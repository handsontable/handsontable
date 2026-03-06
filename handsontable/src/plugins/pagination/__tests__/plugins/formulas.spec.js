import HyperFormula from 'hyperformula';

describe('Pagination integration with Formulas', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should update the pagination state after filtering values', async() => {
    handsontable({
      data: [
        ['Mary', '=CONCATENATE(A4, " Smith")', '01/14/2017', 6999.95],
        ['Henry', 'Jones', '12/01/2018', 8330],
        ['Mary', 'Brown', '01/14/2017', 4000],
        ['Robert', 'Evans', '=D2 * 2', 30500]
      ],
      colHeaders: true,
      formulas: {
        engine: HyperFormula
      },
      pagination: {
        pageSize: 2,
      },
    });

    const pagination = getPlugin('pagination');

    expect(getMaster().find('td:nth-child(2)').map((_, td) => $(td).text().trim()).get()).toEqual([
      'Robert Smith',
      'Jones',
    ]);
    expect(countVisibleRows()).toBe(2);

    pagination.setPage(2);

    expect(getMaster().find('td:nth-child(3)').map((_, td) => $(td).text().trim()).get()).toEqual([
      '01/14/2017',
      '16660',
    ]);
    expect(countVisibleRows()).toBe(2);

    await setDataAtCell(1, 3, 33);

    expect(getMaster().find('td:nth-child(3)').map((_, td) => $(td).text().trim()).get()).toEqual([
      '01/14/2017',
      '66',
    ]);
    expect(countVisibleRows()).toBe(2);
  });
});
