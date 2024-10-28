describe('a11y DOM attributes (ARIA tags)', () => {
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

  it('should assign the `role=button` to the `Select All` and `Clear` links', async() => {
    handsontable({
      colHeaders: true,
      filters: true,
      dropdownMenu: true,
    });

    dropdownMenu(0);

    expect(document.querySelector('.htUISelectAll').getAttribute('role')).toEqual('button');
    expect(document.querySelector('.htUIClearAll').getAttribute('role')).toEqual('button');
  });
});
