describe('Core.spliceCellsMeta', () => {
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

  it('should splice the cell meta array analogously to the native `splice` method', () => {
    handsontable();

    let allMeta = getCellsMeta();
    expect(allMeta.length).toBe(25);
    spliceCellsMeta(3, 1);
    allMeta = getCellsMeta();
    expect(allMeta.length).toBe(20);

    let metaAtRow = getCellMetaAtRow(2);
    expect(metaAtRow[0].row).toEqual(2);
    metaAtRow = getCellMetaAtRow(3);
    expect(metaAtRow[0].row).toEqual(4);
  });
});
