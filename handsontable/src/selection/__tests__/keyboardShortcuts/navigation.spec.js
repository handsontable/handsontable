describe('Selection navigation', () => {
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

  it('should not throw an error when dataset is empty', () => {
    handsontable({
      data: [],
      rowHeaders: true,
      colHeaders: true,
    });

    selectAll();
    listen();

    expect(() => keyDownUp('home')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'home'])).not.toThrow();
    expect(() => keyDownUp('end')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'end'])).not.toThrow();
    expect(() => keyDownUp('arrowtop')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'arrowtop'])).not.toThrow();
    expect(() => keyDownUp('arrowbottom')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'arrowbottom'])).not.toThrow();
    expect(() => keyDownUp('arrowright')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'arrowright'])).not.toThrow();
    expect(() => keyDownUp('arrowleft')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'arrowleft'])).not.toThrow();
    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: -1,-1']);
  });
});
