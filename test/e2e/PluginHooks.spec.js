describe('PluginHooks', () => {

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

  it('should remove a global hook', () => {
    let test = 0;
    const hook = function() {
      test = 5;
    };

    Handsontable.hooks.add('afterInit', hook);
    Handsontable.hooks.remove('afterInit', hook);

    handsontable();

    expect(test).toEqual(0);
  });

  it('should remove a local hook', () => {
    let test = 0;
    const hook = function() {
      test = 5;
    };

    handsontable();

    getInstance().addHook('afterInit', hook);
    getInstance().removeHook('afterInit', hook);

    expect(test).toEqual(0);
  });

  it('should run global hook', () => {
    let test = 0;

    Handsontable.hooks.add('afterInit', () => {
      test = 5;
    });
    handsontable();
    expect(test).toEqual(5);
  });

  it('should run local hook', () => {
    let test = 0;

    handsontable();

    getInstance().addHook('myHook', () => {
      test += 5;
    });
    getInstance().runHooks('myHook');
    getInstance().runHooks('myHook');

    expect(test).toEqual(10);
  });

  it('should run local hook once', () => {
    let test = 0;

    handsontable();

    getInstance().addHookOnce('myHook', () => {
      test += 5;
    });
    getInstance().runHooks('myHook');
    getInstance().runHooks('myHook');

    expect(test).toEqual(5);
  });

  it('should run all hooks', () => {
    let test = 0;

    Handsontable.hooks.add('afterInit', () => {
      test += 5;
    });

    handsontable({
      afterInit() {
        test += 5;
      }
    });

    expect(test).toEqual(10);
  });

  it('list of all avaliable plugin hooks should be exposed as a public method', () => {
    const hooks = Handsontable.hooks.getRegistered(); // this is used in demo/callbacks.html

    expect(hooks.indexOf('beforeInit')).toBeGreaterThan(-1);
  });

  it('should add a local hook with addHooks method', () => {
    const hot1 = handsontable();

    let test = 0;

    hot1.addHook('myHook', () => {
      test += 5;
    });
    hot1.runHooks('myHook');

    expect(test).toEqual(5);
  });

  it('should remove a local hook with removeHook method', () => {
    const hot1 = handsontable();

    let test = 0;
    const handler = function() {
      test += 5;
    };

    hot1.addHook('myHook', handler);

    hot1.runHooks('myHook');
    hot1.runHooks('myHook');
    expect(test).toEqual(10);

    hot1.removeHook('myHook', handler);
    hot1.runHooks('myHook');

    expect(test).toEqual(10);
  });

  it('should add a local hook with addHookOnce method and run it just once', () => {
    const hot1 = handsontable();

    let test = 0;
    const handler = function() {
      test += 5;
    };

    hot1.addHookOnce('myHook', handler);

    hot1.runHooks('myHook');
    hot1.runHooks('myHook');
    expect(test).toEqual(5);

  });

  it('should run hook with runHooks and return value', () => {
    const hot = handsontable();

    const handler = function() {
      return 5;
    };

    hot.addHook('myHook', handler);

    expect(hot.runHooks('myHook')).toEqual(5);
  });

  it('should run two "once" hooks in desired order', () => {
    const hot = handsontable();
    const arr = [];

    hot.addHookOnce('myHook', () => {
      arr.push(1);
    });

    hot.addHookOnce('myHook', () => {
      arr.push(2);
    });

    hot.runHooks('myHook');

    expect(arr).toEqual([1, 2]);
  });

  it('should execute two "once" hooks in desired order', () => {
    const hot = handsontable();
    const str = 'a';

    hot.addHookOnce('myHook', value => `${value}b`);

    hot.addHookOnce('myHook', value => `${value}c`);

    expect(hot.runHooks('myHook', str)).toEqual('abc');
  });

  it('adding same hook twice should register it only once (without an error)', () => {
    let i = 0;
    const fn = function() {
      i += 1;
    };

    const hot = handsontable({
      afterOnCellMouseOver: fn
    });

    hot.getInstance().updateSettings({ afterOnCellMouseOver: fn });
    hot.runHooks('afterOnCellMouseOver');

    expect(i).toEqual(1);
  });

  it('should mark the hook callbacks added with Handsontable initialization', () => {
    const fn = function() {};
    const fn2 = function() {};

    const hot = handsontable({
      afterChange: fn
    });

    hot.addHook('afterChange', fn2);

    expect(fn.initialHook).toEqual(true);
    expect(fn2.initialHook).toEqual(void 0);
  });

  it('should mark the hook callbacks added using the updateSettings method', () => {
    const fn = function() {};
    const fn2 = function() {};

    const hot = handsontable();

    hot.updateSettings({
      afterChange: fn
    });

    hot.addHook('afterChange', fn2);

    expect(fn.initialHook).toEqual(true);
    expect(fn2.initialHook).toEqual(void 0);
  });

  it('should replace the existing hook callbacks, if they\'re updated using the updateSettings method (when there was a hook ' +
     'already declared in the initialization)', () => {
    const fn = function() {};
    const fn2 = function() {};

    const hot = handsontable({
      afterGetCellMeta: fn
    });

    const initialCallbackCount = hot.pluginHookBucket.afterGetCellMeta.length;

    hot.updateSettings({
      afterGetCellMeta() {
        return { a: 'another function' };
      }
    });

    hot.updateSettings({
      afterGetCellMeta() {
        return { a: 'yet another function' };
      }
    });

    hot.updateSettings({
      afterGetCellMeta: fn2
    });

    expect(hot.pluginHookBucket.afterGetCellMeta.length).toEqual(initialCallbackCount);
  });

  it('should replace the existing hook callbacks, if they\'re updated using the updateSettings method', () => {
    const fn = function() {};
    const fn2 = function() {};

    const hot = handsontable();

    hot.addHook('afterGetCellMeta', () => 'doesn\'t matter 1');
    hot.addHook('afterGetCellMeta', () => 'doesn\'t matter 2');
    hot.addHook('afterGetCellMeta', () => 'doesn\'t matter 3');

    hot.updateSettings({
      afterGetCellMeta: fn
    });

    const initialCallbackCount = hot.pluginHookBucket.afterGetCellMeta.length;

    hot.updateSettings({
      afterGetCellMeta() {
        return { a: 'another function' };
      }
    });

    hot.updateSettings({
      afterGetCellMeta() {
        return { a: 'yet another function' };
      }
    });

    hot.updateSettings({
      afterGetCellMeta: fn2
    });

    expect(hot.pluginHookBucket.afterGetCellMeta.length).toEqual(initialCallbackCount);
  });

  it('should NOT replace existing hook callbacks, if the\'re added using the addHook method', () => {
    const fn = function() {};
    const fn2 = function() {};

    const hot = handsontable();

    hot.updateSettings({
      afterGetCellMeta: fn
    });

    const initialCallbackCount = hot.pluginHookBucket.afterGetCellMeta.length;

    hot.addHook('afterGetCellMeta', () => ({ a: 'another function' }));

    hot.addHook('afterGetCellMeta', () => ({ a: 'yet another function' }));

    hot.addHook('afterGetCellMeta', fn2);

    // should not add this one, as it's a duplicate
    hot.addHook('afterGetCellMeta', fn);

    expect(hot.pluginHookBucket.afterGetCellMeta.length).toEqual(initialCallbackCount + 3);
  });

  describe('controlling handler queue execution', () => {
    it('should execute all handlers if none of them hasn\'t skipped', () => {

      const handler1 = jasmine.createSpy('handler1');
      const handler2 = jasmine.createSpy('handler2');
      const handler3 = jasmine.createSpy('handler3');

      const hot = handsontable();

      hot.addHook('fakeEvent', handler1);
      hot.addHook('fakeEvent', handler2);
      hot.addHook('fakeEvent', handler3);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();

      hot.runHooks('fakeEvent');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });
  });
});
