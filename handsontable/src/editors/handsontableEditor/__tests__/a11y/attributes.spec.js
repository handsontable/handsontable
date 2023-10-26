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

  it('should add an `aria-expanded=true` attribute to the cell when the editor is opened, `aria-expanded=false`' +
    ' otherwise', async() => {
    handsontable({
      type: 'handsontable',
      handsontable: {}
    });

    selectCell(0, 0);

    expect(getCell(0, 0).getAttribute('aria-expanded')).toEqual('false');

    keyDownUp('enter');
    await sleep(50);

    expect(getCell(0, 0).getAttribute('aria-expanded')).toEqual('true');

    keyDownUp('escape');
    await sleep(50);

    expect(getCell(0, 0).getAttribute('aria-expanded')).toEqual('false');
  });
});
