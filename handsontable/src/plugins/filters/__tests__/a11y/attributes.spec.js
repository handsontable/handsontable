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

  it('should assign the `role=button` to the `Select All` and `Select none` links only, not to their wrappers', async() => {
    handsontable({
      colHeaders: true,
      filters: true,
      dropdownMenu: true,
    });

    await dropdownMenu(0);

    expect(document.querySelector('.htUISelectAll a').getAttribute('role')).toEqual('button');
    expect(document.querySelector('.htUIClearAll a').getAttribute('role')).toEqual('button');
    expect(document.querySelector('.htUISelectAll').hasAttribute('role')).toBe(false);
    expect(document.querySelector('.htUIClearAll').hasAttribute('role')).toBe(false);
  });
});
