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

  it('should add the `aria-expanded` attribute to a collapsible header - `true` if it\'s expanded, `false` otherwise', () => {
    const hot = handsontable({
      data: getSimplerNestedData(),
      rowHeaders: true,
      colHeaders: true,
      nestedRows: true,
    });

    expect(getCell(0, -1).getAttribute('aria-expanded')).toEqual('true');
    expect(getCell(6, -1).getAttribute('aria-expanded')).toEqual('true');
    expect(getCell(12, -1).getAttribute('aria-expanded')).toEqual('true');

    hot.getPlugin('nestedRows').collapsingUI.collapseAll();

    expect(getCell(0, -1).getAttribute('aria-expanded')).toEqual('false');
    expect(getCell(1, -1).getAttribute('aria-expanded')).toEqual('false');
    expect(getCell(2, -1).getAttribute('aria-expanded')).toEqual('false');

    hot.getPlugin('nestedRows').collapsingUI.expandAll();

    expect(getCell(0, -1).getAttribute('aria-expanded')).toEqual('true');
    expect(getCell(6, -1).getAttribute('aria-expanded')).toEqual('true');
    expect(getCell(12, -1).getAttribute('aria-expanded')).toEqual('true');
  });

  it('should add the `aria-hidden` attribute to the collapse/expand button', () => {
    const hot = handsontable({
      data: getSimplerNestedData(),
      rowHeaders: true,
      colHeaders: true,
      nestedRows: true,
    });

    expect(getCell(0, -1).querySelector('.ht_nestingButton').getAttribute('aria-hidden')).toEqual('true');
    expect(getCell(6, -1).querySelector('.ht_nestingButton').getAttribute('aria-hidden')).toEqual('true');
    expect(getCell(12, -1).querySelector('.ht_nestingButton').getAttribute('aria-hidden')).toEqual('true');

    hot.getPlugin('nestedRows').collapsingUI.collapseAll();

    expect(getCell(0, -1).querySelector('.ht_nestingButton').getAttribute('aria-hidden')).toEqual('true');
    expect(getCell(1, -1).querySelector('.ht_nestingButton').getAttribute('aria-hidden')).toEqual('true');
    expect(getCell(2, -1).querySelector('.ht_nestingButton').getAttribute('aria-hidden')).toEqual('true');

    hot.getPlugin('nestedRows').collapsingUI.expandAll();

    expect(getCell(0, -1).querySelector('.ht_nestingButton').getAttribute('aria-hidden')).toEqual('true');
    expect(getCell(6, -1).querySelector('.ht_nestingButton').getAttribute('aria-hidden')).toEqual('true');
    expect(getCell(12, -1).querySelector('.ht_nestingButton').getAttribute('aria-hidden')).toEqual('true');
  });
});
