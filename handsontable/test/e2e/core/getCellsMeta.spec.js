describe('Core.getCellsMeta', () => {
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

  it('should return all initialized cells meta as flatten array', () => {
    handsontable();

    const metas = getCellsMeta();

    expect(metas.length).toBe(25); // default data size
    expect(metas[0].row).toBe(0);
    expect(metas[0].col).toBe(0);
    expect(metas[0].prop).toBe(0);
    expect(metas[19].row).toBe(3);
    expect(metas[19].col).toBe(4);
    expect(metas[19].prop).toBe(4);
  });
});
