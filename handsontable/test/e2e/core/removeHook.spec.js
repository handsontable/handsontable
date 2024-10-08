describe('Core.removeHook', () => {
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
    const fn1 = jasmine.createSpy('fn1');

    handsontable({});

    spyOn(Handsontable.hooks, 'remove');
    removeHook('beforeInit', fn1);

    expect(Handsontable.hooks.remove).toHaveBeenCalledWith('beforeInit', fn1, hot());
  });
});
