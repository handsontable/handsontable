describe('Core.addHook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should forward call to the internal Hooks module', async() => {
    const fn1 = jasmine.createSpy('fn1');

    handsontable({});

    spyOn(Handsontable.hooks, 'add');
    addHook('beforeInit', fn1, 10);

    expect(Handsontable.hooks.add).toHaveBeenCalledWith('beforeInit', fn1, hot(), 10);
  });
});
