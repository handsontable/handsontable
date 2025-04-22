describe('Hooks', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should add few local hooks at init (defined as function)', () => {
    const handler1 = jasmine.createSpy('handler1');

    handsontable({
      afterInit: handler1
    });

    expect(handler1).toHaveBeenCalled();
  });

  it('should add few local hooks at init (defined as array)', () => {
    const handler1 = jasmine.createSpy('handler1');
    const handler2 = jasmine.createSpy('handler2');
    const handler3 = jasmine.createSpy('handler3');

    handsontable({
      afterInit: [handler1, handler2, handler3]
    });

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
    expect(handler3).toHaveBeenCalled();
  });

  it('should be possible to list all available plugin hooks', () => {
    const hooks = Handsontable.hooks.getRegistered(); // this is used in demo/callbacks.html

    expect(hooks.indexOf('beforeInit')).toBeGreaterThan(-1);
  });
});
