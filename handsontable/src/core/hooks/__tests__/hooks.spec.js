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

  it('should fire the `beforeInit` hook declared in the settings object', async() => {
    const handler = jasmine.createSpy('handler');

    handsontable({
      beforeInit: handler,
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should fire the `beforeInit` hook declared in the settings object (defined as array)', async() => {
    const handler1 = jasmine.createSpy('handler1');
    const handler2 = jasmine.createSpy('handler2');

    handsontable({
      beforeInit: [handler1, handler2],
    });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should fire the `beforeInit` hook declared in the settings object before the table view is created', async() => {
    let viewAtCallTime = 'the hook was not called';

    handsontable({
      beforeInit() {
        viewAtCallTime = this.view;
      },
    });

    expect(viewAtCallTime).toBeUndefined();
  });

  it('should fire the `beforeInit` hook declared in the settings object before the `afterInit` hook', async() => {
    const callOrder = [];

    handsontable({
      beforeInit: () => callOrder.push('beforeInit'),
      afterInit: () => callOrder.push('afterInit'),
    });

    expect(callOrder).toEqual(['beforeInit', 'afterInit']);
  });

  it('should not register a hook declared in the settings object twice', async() => {
    const beforeInitHandler = jasmine.createSpy('beforeInitHandler');
    const afterInitHandler = jasmine.createSpy('afterInitHandler');

    handsontable({
      beforeInit: beforeInitHandler,
      afterInit: afterInitHandler,
    });

    expect(beforeInitHandler).toHaveBeenCalledTimes(1);
    expect(afterInitHandler).toHaveBeenCalledTimes(1);
  });

  it('should fire the `beforeInit` hook declared in the settings object after the plugins are initialized', async() => {
    let pluginEnabledAtCallTime = 'the hook was not called';

    handsontable({
      comments: true,
      beforeInit() {
        pluginEnabledAtCallTime = this.getPlugin('comments').enabled;
      },
    });

    expect(pluginEnabledAtCallTime).toBe(true);
  });

  it('should fire the `beforeInit` hook added between `new Handsontable.Core()` and `init()`', async() => {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const handler = jasmine.createSpy('handler');
    const hotInstance = new Handsontable.Core(container, {
      licenseKey: 'non-commercial-and-evaluation',
    });

    hotInstance.addHook('beforeInit', handler);
    hotInstance.init();

    expect(handler).toHaveBeenCalledTimes(1);

    hotInstance.destroy();
    container.remove();
  });
});
