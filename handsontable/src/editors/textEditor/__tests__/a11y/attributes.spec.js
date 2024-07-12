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

  it('should add an `aria-hidden` attribute to the editor\'s TEXTAREA element', () => {
    handsontable({});

    selectCell(0, 0);

    expect(getActiveEditor().TEXTAREA.getAttribute('aria-hidden')).toEqual('true');
  });
});
