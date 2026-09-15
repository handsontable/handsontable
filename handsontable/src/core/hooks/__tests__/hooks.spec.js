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
    const handler = jasmine.createSpy('handler');
    let viewAtCallTime;

    handsontable({
      beforeInit() {
        handler();
        viewAtCallTime = this.view;
      },
    });

    // Assert the call first, so a hook that never fires does not read as a wrong value.
    expect(handler).toHaveBeenCalledTimes(1);
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
    const hotInstance = handsontable({
      beforeInit: beforeInitHandler,
      afterInit: afterInitHandler,
    });
    const countEntries = (hookName, callback) => Handsontable.hooks
      .getBucket(hotInstance)
      .getHooks(hookName)
      .filter(entry => entry.callback === callback)
      .length;

    expect(beforeInitHandler).toHaveBeenCalledTimes(1);
    expect(afterInitHandler).toHaveBeenCalledTimes(1);
    // `beforeInit` is registered up front and again by the `updateSettings()` call inside `init()`.
    expect(countEntries('beforeInit', beforeInitHandler)).toBe(1);
    expect(countEntries('afterInit', afterInitHandler)).toBe(1);
    // The helper also writes the callback onto the table meta, so `getSettings()` returns it back.
    expect(getSettings().beforeInit).toBe(beforeInitHandler);
  });

  it('should replace a settings-declared hook in place when `updateSettings()` passes a new callback', async() => {
    const firstHandler = jasmine.createSpy('firstHandler');
    const secondHandler = jasmine.createSpy('secondHandler');
    const hotInstance = handsontable({
      beforeInit: firstHandler,
    });
    const countFixedEntries = () => Handsontable.hooks
      .getBucket(hotInstance)
      .getHooks('beforeInit')
      .filter(entry => entry.initialHook)
      .length;

    expect(countFixedEntries()).toBe(1);

    await updateSettings({ beforeInit: secondHandler });

    // The fixed slot is reused, so repeated `updateSettings()` calls must not stack entries.
    expect(countFixedEntries()).toBe(1);
    expect(Handsontable.hooks.getBucket(hotInstance).getHooks('beforeInit')
      .some(entry => entry.callback === secondHandler)).toBe(true);
    expect(Handsontable.hooks.getBucket(hotInstance).getHooks('beforeInit')
      .some(entry => entry.callback === firstHandler)).toBe(false);
  });

  it('should fire the `beforeInit` hook declared in the settings object after the plugins are initialized', async() => {
    const handler = jasmine.createSpy('handler');
    let pluginEnabledAtCallTime;

    handsontable({
      comments: true,
      beforeInit() {
        handler();
        pluginEnabledAtCallTime = this.getPlugin('comments').enabled;
      },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(pluginEnabledAtCallTime).toBe(true);
  });

  it('should not fire the `construct` hook declared in the settings object, but should fire a global one', async() => {
    const settingsHandler = jasmine.createSpy('settingsHandler');
    const globalHandler = jasmine.createSpy('globalHandler');

    Handsontable.hooks.add('construct', globalHandler);

    try {
      handsontable({
        construct: settingsHandler,
      });

      // `construct` runs inside the constructor, so only `beforeInit` is pulled forward. Generalizing
      // `registerSettingsHook()` to the whole settings walk would turn this green and reorder the
      // plugin callbacks.
      expect(settingsHandler).not.toHaveBeenCalled();
      expect(globalHandler).toHaveBeenCalled();

    } finally {
      Handsontable.hooks.remove('construct', globalHandler);
    }
  });

  it('should not fire the `afterPluginsInitialized` hook declared in the settings object, but should fire a global one', async() => {
    const settingsHandler = jasmine.createSpy('settingsHandler');
    const globalHandler = jasmine.createSpy('globalHandler');

    Handsontable.hooks.add('afterPluginsInitialized', globalHandler);

    try {
      handsontable({
        afterPluginsInitialized: settingsHandler,
      });

      expect(settingsHandler).not.toHaveBeenCalled();
      expect(globalHandler).toHaveBeenCalled();

    } finally {
      Handsontable.hooks.remove('afterPluginsInitialized', globalHandler);
    }
  });

  it('should fire the `beforeInit` hook added between `new Handsontable.Core()` and `init()`', async() => {
    const container = document.createElement('div');
    const handler = jasmine.createSpy('handler');

    document.body.appendChild(container);

    // This is the path every framework wrapper uses, so it has to keep working.
    const hotInstance = new Handsontable.Core(container, {
      licenseKey: 'non-commercial-and-evaluation',
    });

    try {
      hotInstance.addHook('beforeInit', handler);
      hotInstance.init();

      expect(handler).toHaveBeenCalledTimes(1);

    } finally {
      hotInstance.destroy();
      container.remove();
    }
  });
});
