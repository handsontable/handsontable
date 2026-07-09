describe('Core_alter', () => {
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

  it('should pass the source and keepEmptyRows arguments to the beforeAlter hook', async() => {
    const beforeAlter = jasmine.createSpy('beforeAlter');

    handsontable({
      data: [
        ['SKU-4821', 'Harbor Goods'],
        ['SKU-0093', 'Alpine Supply Co.'],
        ['SKU-1180', 'Summit Traders'],
      ],
      beforeAlter,
    });

    await alter('remove_row', 1, 1, 'inventory-cleanup', true);

    expect(beforeAlter).toHaveBeenCalledWith('remove_row', 1, 1, 'inventory-cleanup', true);
  });
});
