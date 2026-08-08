describe('Core.getCellMetaTransient', () => {
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

  it('should return the effective cell configuration, including `cells` and hook-driven properties', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      columns: [{ type: 'numeric' }, {}, {}, {}, {}],
      cells(row, column) {
        if (row === 1 && column === 0) {
          return { readOnly: true };
        }

        return null;
      },
      beforeGetCellMeta(row, column, cellProperties) {
        if (row === 2 && column === 0) {
          cellProperties.className = 'fromHook';
        }
      },
    });

    const meta = getCellMetaTransient(1, 0);

    expect(meta.row).toBe(1);
    expect(meta.col).toBe(0);
    expect(meta.type).toBe('numeric'); // column layer through the prototype chain
    expect(meta.readOnly).toBe(true); // `cells` function applied
    expect(getCellMetaTransient(2, 0).className).toBe('fromHook'); // hook applied
  });

  it('should not permanently retain a meta object for a cell without stored meta', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(200, 10),
      width: 400,
      height: 200,
    });

    const retainedBefore = hot.getCellsMeta().length;

    for (let row = 0; row < 200; row++) {
      getCellMetaTransient(row, 0);
    }

    expect(hot.getCellsMeta().length).toBe(retainedBefore);
  });

  it('should return the stored meta object for a cell that has one', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    await setCellMeta(1, 1, 'className', 'htRight');

    const stored = getCellMeta(1, 1);
    const transient = getCellMetaTransient(1, 1);

    expect(transient).toBe(stored);
    expect(transient.className).toBe('htRight');
  });

  it('should translate visual to physical coordinates after a row move', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(5, 5),
      manualRowMove: true,
    });

    await setCellMeta(4, 0, 'className', 'tracked'); // visual row 4 = physical row 4

    hot.rowIndexMapper.moveIndexes([4], 0); // physical row 4 becomes visual row 0
    await render();

    expect(getCellMetaTransient(0, 0).className).toBe('tracked');
  });
});
