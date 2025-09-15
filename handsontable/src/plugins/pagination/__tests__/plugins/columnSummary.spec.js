describe('Pagination integration with ColumnSummary', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should correctly sort all rows regardless of the currently selected page', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20],
        [11, 12, 13, 14, 15],
        [6, 7, 8, 9, 10],
        [null],
      ],
      colHeaders: ['sum', 'min', 'max', 'count', 'average'],
      columnSummary: [
        {
          sourceColumn: 0,
          type: 'sum',
          destinationRow: 6,
          destinationColumn: 0,
        },
        {
          sourceColumn: 1,
          type: 'min',
          destinationRow: 6,
          destinationColumn: 1,
        },
        {
          sourceColumn: 2,
          type: 'max',
          destinationRow: 6,
          destinationColumn: 2,
        },
        {
          sourceColumn: 3,
          type: 'count',
          destinationRow: 6,
          destinationColumn: 3,
        },
        {
          sourceColumn: 4,
          type: 'average',
          destinationRow: 6,
          destinationColumn: 4,
        },
      ],
      pagination: {
        pageSize: 4,
      },
    });

    const pagination = getPlugin('pagination');

    expect(getMaster().find('tr:last-child td').map((_, td) => $(td).text().trim()).get()).toEqual([
      '16', '17', '18', '19', '20',
    ]);

    pagination.setPage(2);

    expect(getMaster().find('tr:last-child td').map((_, td) => $(td).text().trim()).get()).toEqual([
      '51', '2', '18', '6', '12.5',
    ]);
  });
});
