describe('Core.runHooks', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should forward call to the internal Hooks module', () => {
    handsontable({});

    spyOn(Handsontable.hooks, 'run').and.returnValue('foo');

    expect(runHooks('beforeInit', 1, 2, 3, 4, 5, 6, 7, 8, 9)).toBe('foo');
    expect(Handsontable.hooks.run).toHaveBeenCalledWith(hot(), 'beforeInit', 1, 2, 3, 4, 5, 6);
  });
});
