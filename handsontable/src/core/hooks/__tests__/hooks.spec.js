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

  it('should add few local hooks at init (defined as function)', async() => {
    const handler1 = jasmine.createSpy('handler1');

    handsontable({
      afterInit: handler1
    });

    expect(handler1).toHaveBeenCalled();
  });

  it('should add few local hooks at init (defined as array)', async() => {
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

  it('should be possible to list all available plugin hooks', async() => {
    const hooks = Handsontable.hooks.getRegistered(); // this is used in demo/callbacks.html

    expect(hooks.indexOf('beforeInit')).toBeGreaterThan(-1);
  });

  it('should be possible to re-enable previously removed hooks', async() => {
    const callback = () => {};
    const callbackSpy = spyOn(callback, 'call').and.callThrough();

    handsontable({
      data: [[1, 2]],
      afterLoadData: callback,
    });

    expect(callbackSpy).toHaveBeenCalled();

    await removeHook('afterLoadData', callback);
    callbackSpy.calls.reset();

    await loadData([[3, 4]]);

    expect(callbackSpy).not.toHaveBeenCalled();

    await addHook('afterLoadData', callback);
    callbackSpy.calls.reset();

    await loadData([[1, 2]]);

    expect(callbackSpy).toHaveBeenCalled();
  });
});
