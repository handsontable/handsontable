import { Hooks } from 'handsontable/core/hooks';

describe('Hooks', () => {
  it('should create global empty bucket on construct', () => {
    const hooks = new Hooks();

    expect(hooks.globalBucket).toBeDefined();
  });

  describe('getBucket()', () => {
    it('should return global bucket when the context is missing', () => {
      const hooks = new Hooks();

      expect(hooks.getBucket()).toBe(hooks.globalBucket);
    });

    it('should create and return a new bucket when the context is passed', () => {
      const hooks = new Hooks();
      const context = {};

      expect(hooks.getBucket(context)).toBe(context.pluginHookBucket);
      expect(context.pluginHookBucket).toBeDefined();
    });
  });

  describe('add()', () => {
    it('should be possible to add hooks as array', () => {
      const hooks = new Hooks();
      const fn1 = function() {};
      const fn2 = function() {};
      const fn3 = function() {};
      const context = {};
      const mockBucket = { add: jasmine.createSpy('add') };

      spyOn(hooks, 'getBucket').and.returnValue(mockBucket);

      hooks.add('test', [fn1, fn2, fn3, fn3, fn3], context);

      expect(mockBucket.add.calls.count()).toBe(5);
      expect(mockBucket.add.calls.mostRecent()).toEqual({
        object: mockBucket,
        args: ['test', fn3, { orderIndex: undefined, runOnce: false }],
        returnValue: undefined
      });
    });

    it('should be possible to add hook as a function', () => {
      const hooks = new Hooks();
      const fn1 = function() {};
      const context = {};
      const mockBucket = { add: jasmine.createSpy('add') };

      spyOn(hooks, 'getBucket').and.returnValue(mockBucket);

      hooks.add('test', fn1, context);

      expect(mockBucket.add.calls.count()).toBe(1);
      expect(mockBucket.add.calls.mostRecent()).toEqual({
        object: mockBucket,
        args: ['test', fn1, { orderIndex: undefined, runOnce: false }],
        returnValue: undefined
      });
    });

    it('should be possible to add hook as a function with order', () => {
      const hooks = new Hooks();
      const fn1 = function() {};
      const context = {};
      const mockBucket = { add: jasmine.createSpy('add') };

      spyOn(hooks, 'getBucket').and.returnValue(mockBucket);

      hooks.add('test', fn1, context, 10);

      expect(mockBucket.add.calls.count()).toBe(1);
      expect(mockBucket.add.calls.mostRecent()).toEqual({
        object: mockBucket,
        args: ['test', fn1, { orderIndex: 10, runOnce: false }],
        returnValue: undefined
      });
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
    });
  });

  describe('addAsFixed()', () => {
    it('should be possible to add hooks as array', () => {
      const hooks = new Hooks();
      const fn1 = function() {};
      const fn2 = function() {};
      const fn3 = function() {};
      const context = {};
      const mockBucket = { add: jasmine.createSpy('add') };

      spyOn(hooks, 'getBucket').and.returnValue(mockBucket);

      hooks.addAsFixed('test', [fn1, fn2, fn3, fn3, fn3], context);

      expect(mockBucket.add.calls.count()).toBe(5);
      expect(mockBucket.add.calls.mostRecent()).toEqual({
        object: mockBucket,
        args: ['test', fn3, { initialHook: true }],
        returnValue: undefined
      });
    });

    it('should be possible to add hook as a function', () => {
      const hooks = new Hooks();
      const fn1 = function() {};
      const context = {};
      const mockBucket = { add: jasmine.createSpy('add') };

      spyOn(hooks, 'getBucket').and.returnValue(mockBucket);

      hooks.addAsFixed('test', fn1, context);

      expect(mockBucket.add.calls.count()).toBe(1);
      expect(mockBucket.add.calls.mostRecent()).toEqual({
        object: mockBucket,
        args: ['test', fn1, { initialHook: true }],
        returnValue: undefined
      });
    });
  });

  describe('once()', () => {
    it('should be possible to add hooks as array', () => {
      const hooks = new Hooks();
      const fn1 = function() {};
      const fn2 = function() {};
      const fn3 = function() {};
      const context = {};
      const mockBucket = { add: jasmine.createSpy('add') };

      spyOn(hooks, 'getBucket').and.returnValue(mockBucket);

      hooks.once('test', [fn1, fn2, fn3, fn3, fn3], context);

      expect(mockBucket.add.calls.count()).toBe(5);
      expect(mockBucket.add.calls.mostRecent()).toEqual({
        object: mockBucket,
        args: ['test', fn3, { orderIndex: undefined, runOnce: true }],
        returnValue: undefined
      });
    });

    it('should be possible to add hook as a function', () => {
      const hooks = new Hooks();
      const fn1 = function() {};
      const context = {};
      const mockBucket = { add: jasmine.createSpy('add') };

      spyOn(hooks, 'getBucket').and.returnValue(mockBucket);

      hooks.once('test', fn1, context);

      expect(mockBucket.add.calls.count()).toBe(1);
      expect(mockBucket.add.calls.mostRecent()).toEqual({
        object: mockBucket,
        args: ['test', fn1, { orderIndex: undefined, runOnce: true }],
        returnValue: undefined
      });
    });

    it('should be possible to add hook as a function with order', () => {
      const hooks = new Hooks();
      const fn1 = function() {};
      const context = {};
      const mockBucket = { add: jasmine.createSpy('add') };

      spyOn(hooks, 'getBucket').and.returnValue(mockBucket);

      hooks.once('test', fn1, context, 10);

      expect(mockBucket.add.calls.count()).toBe(1);
      expect(mockBucket.add.calls.mostRecent()).toEqual({
        object: mockBucket,
        args: ['test', fn1, { orderIndex: 10, runOnce: true }],
        returnValue: undefined
      });
    });
  });

  describe('remove()', () => {
    it('should be possible to remove hook', () => {
      const hooks = new Hooks();
      const fn1 = function() {};
      const context = {};
      const mockBucket = { remove: jasmine.createSpy('remove') };

      spyOn(hooks, 'getBucket').and.returnValue(mockBucket);

      hooks.remove('test', fn1, context);

      expect(mockBucket.remove.calls.count()).toBe(1);
      expect(mockBucket.remove.calls.mostRecent()).toEqual({
        object: mockBucket,
        args: ['test', fn1],
        returnValue: undefined
      });
    });
  });

  describe('has()', () => {
    it('should be possible to check if the hook exists in the bucket', () => {
      const hooks = new Hooks();
      const context = {};
      const mockBucket = { has: jasmine.createSpy('has') };

      spyOn(hooks, 'getBucket').and.returnValue(mockBucket);

      hooks.has('test', context);

      expect(mockBucket.has.calls.count()).toBe(1);
      expect(mockBucket.has.calls.mostRecent()).toEqual({
        object: mockBucket,
        args: ['test'],
        returnValue: undefined
      });
    });
  });

  describe('has()', () => {
    it('should be possible to check if the hook exists in the bucket', () => {
      const hooks = new Hooks();
      const context = {};
      const mockBucket = { has: jasmine.createSpy('has') };

      spyOn(hooks, 'getBucket').and.returnValue(mockBucket);

      hooks.has('test', context);

      expect(mockBucket.has.calls.count()).toBe(1);
      expect(mockBucket.has.calls.mostRecent()).toEqual({
        object: mockBucket,
        args: ['test'],
        returnValue: undefined
      });
    });
  });

  describe('run()', () => {
    it('should run hooks pass an arguments to all callback and return the value of the latest function', () => {
      const hooks = new Hooks();
      const fn1 = jasmine.createSpy('fn1').and.returnValue('Foo');
      const fn2 = jasmine.createSpy('fn2').and.returnValue('Bar');
      const fn3 = jasmine.createSpy('fn3');
      const context = {};
      let result;

      hooks.add('test', fn1);
      hooks.add('test', fn2, context);
      hooks.add('test', fn3, context);
      hooks.add('test', fn3);

      result = hooks.run(context, 'test');

      expect(result).toBe('Bar');
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn1).toHaveBeenCalledWith();
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledWith('Foo');
      expect(fn3).toHaveBeenCalledTimes(2);
      expect(fn3).toHaveBeenCalledWith('Bar');

      fn1.calls.reset();
      fn2.calls.reset();
      fn3.calls.reset();

      result = hooks.run(context, 'test', 1, 2, 'AB');

      expect(result).toBe('Bar');
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn1).toHaveBeenCalledWith(1, 2, 'AB');
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledWith('Foo', 2, 'AB');
      expect(fn3).toHaveBeenCalledTimes(2);
      expect(fn3).toHaveBeenCalledWith('Bar', 2, 'AB');
    });

    it('should run hooks once', () => {
      const hooks = new Hooks();
      const fn1 = jasmine.createSpy('fn1').and.returnValue('Foo');
      const fn2 = jasmine.createSpy('fn2').and.returnValue('Bar');
      const fn3 = jasmine.createSpy('fn3');
      const context = {};
      let result;

      hooks.once('test', fn1);
      hooks.once('test', fn2, context);
      hooks.once('test', fn3, context);
      hooks.once('test', fn3);

      result = hooks.run(context, 'test');

      expect(result).toBe('Bar');
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
      expect(fn3).toHaveBeenCalledTimes(2);

      fn1.calls.reset();
      fn2.calls.reset();
      fn3.calls.reset();

      result = hooks.run(context, 'test');

      expect(result).toBe(undefined);
      expect(fn1).toHaveBeenCalledTimes(0);
      expect(fn2).toHaveBeenCalledTimes(0);
      expect(fn3).toHaveBeenCalledTimes(0);
    });
  });

  describe('destroy()', () => {
    it('should be possible to remove hook', () => {
      const hooks = new Hooks();
      const context = {};
      const mockBucket = { destroy: jasmine.createSpy('destroy') };

      spyOn(hooks, 'getBucket').and.returnValue(mockBucket);

      hooks.destroy(context);

      expect(mockBucket.destroy.calls.count()).toBe(1);
      expect(mockBucket.destroy.calls.mostRecent()).toEqual({
        object: mockBucket,
        args: [],
        returnValue: undefined
      });
    });
  });

  describe('register()', () => {
    it('should register the new hook name', () => {
      const hooks = new Hooks();

      hooks.register('test2');

      expect(hooks.getRegistered().indexOf('test2')).toBeGreaterThan(-1);
    });
  });

  describe('isRegistered()', () => {
    it('should register the new hook name', () => {
      const hooks = new Hooks();

      expect(hooks.isRegistered('test3')).toBe(false);

      hooks.register('test3');

      expect(hooks.isRegistered('test3')).toBe(true);
    });
  });

  describe('deregister()', () => {
    it('should deregister the new hook name from the collection', () => {
      const hooks = new Hooks();

      hooks.register('test4');

      expect(hooks.getRegistered().indexOf('test4')).toBeGreaterThan(-1);

      hooks.deregister('test4');

      expect(hooks.getRegistered().indexOf('test4')).toBe(-1);
    });
  });

  describe('getRegistered()', () => {
    it('should return the list of registered hooks', () => {
      const hooks = new Hooks();

      expect(hooks.getRegistered().length).toBeGreaterThan(0);
    });
  });

  describe('isDeprecated()', () => {
    it('should returns `true` if hooks is deprecated', () => {
      const hooks = new Hooks();

      expect(hooks.isDeprecated('skipLengthCache')).toBe(true);
      expect(hooks.isDeprecated('test2')).toBe(false);
    });
  });
});
