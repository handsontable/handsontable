describe('Core: server-side data mode', () => {
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

  it('should pass pagination, sorting, and filtering query parameters to dataProvider', async() => {
    const queryHistory = [];
    const sourceRows = [
      { id: 1, name: 'Alpha', category: 'a' },
      { id: 2, name: 'Bravo', category: 'b' },
      { id: 3, name: 'Charlie', category: 'a' },
      { id: 4, name: 'Delta', category: 'b' },
      { id: 5, name: 'Echo', category: 'a' },
      { id: 6, name: 'Foxtrot', category: 'b' },
    ];
    const dataProvider = async(queryParameters) => {
      queryHistory.push(queryParameters);

      let rows = sourceRows.slice();

      if (queryParameters.filters?.category) {
        rows = rows.filter(row => row.category.includes(queryParameters.filters.category.value));
      }
      if (queryParameters.sort?.column) {
        const directionFactor = queryParameters.sort.direction === 'asc' ? 1 : -1;

        rows.sort((rowA, rowB) => {
          if (rowA[queryParameters.sort.column] > rowB[queryParameters.sort.column]) {
            return directionFactor;
          }
          if (rowA[queryParameters.sort.column] < rowB[queryParameters.sort.column]) {
            return -directionFactor;
          }

          return 0;
        });
      }

      const start = (queryParameters.page - 1) * queryParameters.pageSize;
      const end = start + queryParameters.pageSize;

      return {
        rows: rows.slice(start, end),
        totalRows: rows.length,
      };
    };

    handsontable({
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'category' },
      ],
      pagination: {
        pageSize: 2,
      },
      columnSorting: true,
      filters: true,
      dropdownMenu: true,
      dataProvider,
    });

    await sleep(150);
    expect(queryHistory[0]).toEqual({
      page: 1,
      pageSize: 2,
      sort: null,
      filters: null,
    });

    getPlugin('pagination').setPage(2);
    await sleep(180);
    expect(queryHistory[queryHistory.length - 1].page).toBe(2);

    getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
    await sleep(180);
    expect(queryHistory[queryHistory.length - 1].sort).toEqual({
      column: 'name',
      direction: 'desc',
    });
    expect(queryHistory[queryHistory.length - 1].page).toBe(1);

    getPlugin('filters').addCondition(2, 'contains', ['a']);
    getPlugin('filters').filter();
    await sleep(180);
    expect(queryHistory[queryHistory.length - 1].filters).toEqual({
      category: {
        operator: 'contains',
        value: 'a',
      },
    });
  });

  it('should support server-side create/update/remove API methods', async() => {
    let sourceRows = [
      { id: 1, name: 'Alice', category: 'x' },
      { id: 2, name: 'Bob', category: 'y' },
    ];
    const onRowCreate = jasmine.createSpy('onRowCreate').and.callFake(async(rowData) => {
      sourceRows.push({
        id: 3,
        name: rowData.name ?? 'Created',
        category: rowData.category ?? 'z',
      });
    });
    const onRowUpdate = jasmine.createSpy('onRowUpdate').and.callFake(async(idToUpdate, changes) => {
      sourceRows = sourceRows.map((row) => {
        if (row.id === idToUpdate) {
          return { ...row, ...changes };
        }

        return row;
      });
    });
    const onRowRemove = jasmine.createSpy('onRowRemove').and.callFake(async(idToRemove) => {
      sourceRows = sourceRows.filter(row => row.id !== idToRemove);
    });
    const dataProvider = async() => ({
      rows: sourceRows.slice(),
      totalRows: sourceRows.length,
    });

    handsontable({
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'category' },
      ],
      dataProvider,
      rowId: 'id',
      onRowCreate,
      onRowUpdate,
      onRowRemove,
    });

    await sleep(150);

    await hot().createRow({ name: 'Carla', category: 'z' });
    expect(onRowCreate).toHaveBeenCalledWith({ name: 'Carla', category: 'z' });
    expect(getDataAtCell(2, 1)).toBe('Carla');

    await hot().updateRow(2, { name: 'Bobby' });
    expect(onRowUpdate).toHaveBeenCalledWith(2, { name: 'Bobby' }, jasmine.any(Object));
    expect(getDataAtCell(1, 1)).toBe('Bobby');

    await hot().removeRow(1);
    expect(onRowRemove).toHaveBeenCalledWith(1);
    expect(getDataAtCell(0, 0)).toBe(2);
  });
});
