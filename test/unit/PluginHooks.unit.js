import Hooks from 'handsontable/pluginHooks';

describe('PluginHooks', () => {
  it('should create global empty bucket on construct', () => {
    const hooks = new Hooks();

    expect(hooks.globalBucket).toBeDefined();
    expect(hooks.globalBucket.afterInit).toEqual([]);
    expect(hooks.globalBucket.beforeInit).toEqual([]);
    expect(hooks.globalBucket.init).toEqual([]);
  });

  it('should create empty object (bucket) on createEmptyBucket call', () => {
    const hooks = new Hooks();
    const bucket = hooks.createEmptyBucket();

    expect(bucket.afterInit).toEqual([]);
    expect(bucket.beforeInit).toEqual([]);
    expect(bucket.init).toEqual([]);
    expect(bucket).not.toBe(hooks.createEmptyBucket());
  });

  it('should create and get local bucket when context is passed', () => {
    const hooks = new Hooks();
    const context = {};
    const bucket = hooks.getBucket(context);

    expect(context.pluginHookBucket).toBeDefined();
    expect(context.pluginHookBucket).toBe(bucket);
  });

  it('should get global bucket when context is empty', () => {
    const hooks = new Hooks();
    const bucket = hooks.getBucket();

    expect(bucket).toBe(hooks.globalBucket);
  });

  it('should add hooks as array', () => {
    const hooks = new Hooks();
    const fn1 = function() {};
    const fn2 = function() {};
    const fn3 = function() {};
    const context = {};
    const bucket = {};

    spyOn(hooks, 'getBucket').and.returnValue(bucket);
    spyOn(hooks, 'register');

    hooks.add('test', [fn1, fn2, fn3, fn3, fn3], context);

    expect(hooks.getBucket.calls.count()).toBe(5);
    expect(hooks.getBucket.calls.mostRecent()).toEqual({ object: hooks, args: [{}], returnValue: bucket });
    expect(hooks.register.calls.count()).toBe(1);
    expect(hooks.register.calls.mostRecent()).toEqual({ object: hooks, args: ['test'], returnValue: void 0 });

    expect(bucket.test.length).toBe(3);
    expect(bucket.test[0]).toBe(fn1);
    expect(bucket.test[1]).toBe(fn2);
    expect(bucket.test[2]).toBe(fn3);
  });

  it('should add hook as function', () => {
    const hooks = new Hooks();
    const fn1 = function() {};
    const fn2 = function() {};
    const context = {};
    const bucket = { test: [] };

    spyOn(hooks, 'getBucket').and.returnValue(bucket);
    spyOn(hooks, 'register');

    hooks.add('test', fn1, context);
    hooks.add('test', fn1);
    hooks.add('test', fn2, context);

    expect(hooks.getBucket.calls.count()).toBe(3);
    expect(hooks.getBucket.calls.argsFor(0)[0]).toBe(context);
    expect(hooks.getBucket.calls.argsFor(1)[0]).toBe(null);
    expect(hooks.getBucket.calls.argsFor(2)[0]).toBe(context);
    expect(hooks.register).not.toHaveBeenCalled();

    expect(bucket.test.length).toBe(2);
    expect(bucket.test[0]).toBe(fn1);
    expect(bucket.test[1]).toBe(fn2);
  });

  it('should add hook once as array', () => {
    const hooks = new Hooks();
    const fn1 = function() {};
    const fn2 = function() {};
    const fn3 = function() {};
    const context = {};

    spyOn(hooks, 'add');

    hooks.once('test', [fn1, fn2, fn3, fn3, fn3], context);

    expect(fn1.runOnce).toBe(true);
    expect(fn2.runOnce).toBe(true);
    expect(fn3.runOnce).toBe(true);
    expect(hooks.add.calls.count()).toBe(5);
    expect(hooks.add.calls.mostRecent()).toEqual({ object: hooks, args: ['test', fn3, context], returnValue: void 0 });
  });

  it('should add hook once as function', () => {
    const hooks = new Hooks();
    const fn1 = function() {};
    const fn2 = function() {};
    const context = {};

    spyOn(hooks, 'add');

    hooks.once('test', fn1, context);
    hooks.once('test', fn2);

    expect(fn1.runOnce).toBe(true);
    expect(fn2.runOnce).toBe(true);
    expect(hooks.add.calls.count()).toBe(2);
    expect(hooks.add.calls.argsFor(0)[0]).toBe('test');
    expect(hooks.add.calls.argsFor(0)[1]).toBe(fn1);
    expect(hooks.add.calls.argsFor(0)[2]).toBe(context);
    expect(hooks.add.calls.argsFor(1)[0]).toBe('test');
    expect(hooks.add.calls.argsFor(1)[1]).toBe(fn2);
    expect(hooks.add.calls.argsFor(1)[2]).toBe(null);
  });

  it('should print out a warning message if removed hook from API is used', () => {
    const hooks = new Hooks();
    const fn1 = function() {};
    const context = {};

    spyOn(console, 'warn');

    hooks.add('skipLengthCache', fn1, context);

    // eslint-disable-next-line no-console
    expect(console.warn.calls.mostRecent().args)
      .toEqual([
        'The plugin hook "skipLengthCache" was removed in Handsontable' +
        ' 8.0.0. Please consult release notes https://github.com/handsontable/handsontable/releases/tag/8.0.0' +
        ' to learn about the migration path.'
      ]);
    expect(context.pluginHookBucket.skipLengthCache).toEqual([fn1]);
  });

  it('should remove hook', () => {
    const hooks = new Hooks();
    const fn1 = function() {};
    const fn2 = function() {};
    const fn3 = function() {};
    const bucket = { test: [fn1, fn2] };
    let result;

    spyOn(hooks, 'getBucket').and.returnValue(bucket);

    result = hooks.remove('test2', fn1);

    expect(result).toBe(false);
    expect(bucket.test.length).toBe(2);

    result = hooks.remove('test', fn3);

    expect(result).toBe(false);
    expect(bucket.test.length).toBe(2);

    result = hooks.remove('test', fn1);

    expect(result).toBe(true);
    expect(bucket.test[0].skip).toBe(true);
    expect(bucket.test.length).toBe(2);
  });

  it('should run hook', () => {
    const hooks = new Hooks();
    const fn1 = jasmine.createSpy('fn1').and.returnValue('Foo');
    const fn2 = jasmine.createSpy('fn2').and.returnValue('Bar');
    const fn3 = jasmine.createSpy('fn3');
    const context = {};
    const bucket = { test: [fn1, fn2] };
    let result;

    hooks.globalBucket.test = [fn3];

    spyOn(hooks, 'getBucket').and.returnValue(bucket);
    spyOn(hooks, 'remove');

    result = hooks.run(context, 'test');

    expect(result).toBe('Bar');
    expect(hooks.getBucket).toHaveBeenCalledWith(context);
    expect(hooks.remove).not.toHaveBeenCalled();
    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
    expect(fn3).toHaveBeenCalled();

    fn1.calls.reset();
    fn1.runOnce = true;
    fn2.calls.reset();
    fn3.calls.reset();
    result = hooks.run(context, 'test', 1, 2, 'AB');

    expect(result).toBe('Bar');
    expect(hooks.remove).toHaveBeenCalledWith('test', fn1, context);
    expect(fn1).toHaveBeenCalledWith(1, 2, 'AB');
    expect(fn2).toHaveBeenCalledWith('Foo', 2, 'AB');
    expect(fn3).toHaveBeenCalledWith(1, 2, 'AB');
  });

  it('should run hooks added as once', () => {
    const hooks = new Hooks();
    const fn1 = jasmine.createSpy('fn1').and.returnValue('Foo');
    const fn2 = jasmine.createSpy('fn2').and.returnValue('Bar');
    const fn3 = jasmine.createSpy('fn3');
    const context = { pluginHookBucket: { test: [fn1, fn2] } };

    fn1.runOnce = true;
    fn2.runOnce = true;
    fn3.runOnce = true;
    hooks.globalBucket = { test: [fn3] };

    hooks.run(context, 'test');
    hooks.run(context, 'test');
    hooks.run(context, 'test');

    expect(fn1.calls.count()).toBe(1);
    expect(fn2.calls.count()).toBe(1);
    expect(fn3.calls.count()).toBe(1);
  });

  it('should destroy hooks', () => {
    const hooks = new Hooks();
    const fn1 = jasmine.createSpy('fn1').and.returnValue('Foo');
    const fn2 = jasmine.createSpy('fn2').and.returnValue('Bar');
    const fn3 = jasmine.createSpy('fn3');
    const context = {};
    const bucket = { test: [fn1, fn2, fn3], test2: [fn3] };

    spyOn(hooks, 'getBucket').and.returnValue(bucket);

    hooks.destroy(context);

    expect(hooks.getBucket).toHaveBeenCalledWith(context);
    expect(bucket.test.length).toBe(0);
    expect(bucket.test2.length).toBe(0);
  });

  it('should register hook', () => {
    const hooks = new Hooks();

    spyOn(hooks, 'isRegistered').and.returnValue(false);

    hooks.register('test');

    expect(hooks.isRegistered).toHaveBeenCalledWith('test');
    expect(hooks.getRegistered().indexOf('test')).toBeGreaterThan(-1);

    hooks.isRegistered.and.returnValue(true);
    hooks.register('test2');

    expect(hooks.isRegistered).toHaveBeenCalledWith('test2');
    expect(hooks.getRegistered().indexOf('test2')).toBe(-1);
  });

  it('should deregister hook', () => {
    const hooks = new Hooks();

    spyOn(hooks, 'isRegistered').and.returnValue(false);
    hooks.register('test');

    hooks.deregister('test');

    expect(hooks.isRegistered).toHaveBeenCalledWith('test');
    expect(hooks.getRegistered().indexOf('test')).toBeGreaterThan(-1);

    hooks.isRegistered.and.returnValue(true);
    hooks.deregister('test2');

    expect(hooks.isRegistered).toHaveBeenCalledWith('test2');
    expect(hooks.getRegistered().indexOf('test2')).toBe(-1);
  });

  it('should returns `true` if hooks is registered', () => {
    const hooks = new Hooks();

    hooks.register('test');

    expect(hooks.isRegistered('test')).toBe(true);
    expect(hooks.isRegistered('test2')).toBe(false);
  });

  it('should returns array of registered hooks', () => {
    const hooks = new Hooks();

    expect(hooks.getRegistered().length).toBeGreaterThan(0);
  });

  it('should returns `true` if hooks is deprecated', () => {
    const hooks = new Hooks();

    expect(hooks.isDeprecated('skipLengthCache')).toBe(true);
    expect(hooks.isDeprecated('test2')).toBe(false);
  });

  it('should returns `true` if at least one listener was added to the hook', () => {
    const hooks = new Hooks();
    const context = {};

    expect(hooks.has('beforeInit', context)).toBe(false);

    hooks.add('beforeInit', () => {}, context);

    expect(hooks.has('beforeInit', context)).toBe(true);
  });
});
