describe('Core.getCellMetaAtRow', () => {
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

  it('should return a row of cell meta in a form of an array', () => {
    handsontable();

    const rowOfMeta = getCellMetaAtRow(0);

    expect(rowOfMeta.length).toBe(5);
    expect(rowOfMeta[0].row).toBe(0);
    expect(rowOfMeta[1].row).toBe(0);
    expect(rowOfMeta[2].row).toBe(0);
    expect(rowOfMeta[3].row).toBe(0);
    expect(rowOfMeta[4].row).toBe(0);
    expect(rowOfMeta[0].col).toBe(0);
    expect(rowOfMeta[1].col).toBe(1);
    expect(rowOfMeta[2].col).toBe(2);
    expect(rowOfMeta[3].col).toBe(3);
    expect(rowOfMeta[4].col).toBe(4);
    expect(rowOfMeta[0].prop).toBe(0);
    expect(rowOfMeta[1].prop).toBe(1);
    expect(rowOfMeta[2].prop).toBe(2);
    expect(rowOfMeta[3].prop).toBe(3);
    expect(rowOfMeta[4].prop).toBe(4);
  });
});
