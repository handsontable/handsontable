describe('PluginHooks', function () {

  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('unit tests', function() {
    it('should create global empty bucket on construct', function () {
      var hooks = new Handsontable.utils.Hooks();

      expect(hooks.globalBucket).toBeDefined();
      expect(hooks.globalBucket.afterInit).toEqual([]);
      expect(hooks.globalBucket.beforeInit).toEqual([]);
      expect(hooks.globalBucket.init).toEqual([]);
    });

    it('should create empty object (bucket) on createEmptyBucket call', function () {
      var hooks = new Handsontable.utils.Hooks();
      var bucket = hooks.createEmptyBucket();

      expect(bucket.afterInit).toEqual([]);
      expect(bucket.beforeInit).toEqual([]);
      expect(bucket.init).toEqual([]);
      expect(bucket).not.toBe(hooks.createEmptyBucket());
    });

    it('should create and get local bucket when context is passed', function () {
      var hooks = new Handsontable.utils.Hooks();
      var context = {};
      var bucket = hooks.getBucket(context);

      expect(context.pluginHookBucket).toBeDefined();
      expect(context.pluginHookBucket).toBe(bucket);
    });

    it('should get global bucket when context is empty', function () {
      var hooks = new Handsontable.utils.Hooks();
      var bucket = hooks.getBucket();

      expect(bucket).toBe(hooks.globalBucket);
    });

    it('should add hooks as array', function () {
      var hooks = new Handsontable.utils.Hooks();
      var fn1 = function () {};
      var fn2 = function () {};
      var fn3 = function () {};
      var context = {};
      var bucket = {};

      spyOn(hooks, 'getBucket').andReturn(bucket);
      spyOn(hooks, 'register');

      hooks.add('test', [fn1, fn2, fn3, fn3, fn3], context);

      expect(hooks.getBucket.calls.length).toBe(5);
      expect(hooks.getBucket.mostRecentCall.args[0]).toBe(context);
      expect(hooks.register.calls.length).toBe(1);
      expect(hooks.register.mostRecentCall.args[0]).toBe('test');

      expect(bucket.test.length).toBe(3);
      expect(bucket.test[0]).toBe(fn1);
      expect(bucket.test[1]).toBe(fn2);
      expect(bucket.test[2]).toBe(fn3);
    });

    it('should add hook as function', function () {
      var hooks = new Handsontable.utils.Hooks();
      var fn1 = function () {};
      var fn2 = function () {};
      var context = {};
      var bucket = {test: []};

      spyOn(hooks, 'getBucket').andReturn(bucket);
      spyOn(hooks, 'register');

      hooks.add('test', fn1, context);
      hooks.add('test', fn1);
      hooks.add('test', fn2, context);

      expect(hooks.getBucket.calls.length).toBe(3);
      expect(hooks.getBucket.calls[0].args[0]).toBe(context);
      expect(hooks.getBucket.calls[1].args[0]).toBe(null);
      expect(hooks.getBucket.calls[2].args[0]).toBe(context);
      expect(hooks.register).not.toHaveBeenCalled();

      expect(bucket.test.length).toBe(2);
      expect(bucket.test[0]).toBe(fn1);
      expect(bucket.test[1]).toBe(fn2);
    });

    it('should add hook once as array', function () {
      var hooks = new Handsontable.utils.Hooks();
      var fn1 = function () {};
      var fn2 = function () {};
      var fn3 = function () {};
      var context = {};
      var bucket = {};

      spyOn(hooks, 'add');

      hooks.once('test', [fn1, fn2, fn3, fn3, fn3], context);

      expect(fn1.runOnce).toBe(true);
      expect(fn2.runOnce).toBe(true);
      expect(fn3.runOnce).toBe(true);
      expect(hooks.add.calls.length).toBe(5);
      expect(hooks.add.mostRecentCall.args[0]).toBe('test');
      expect(hooks.add.mostRecentCall.args[1]).toBe(fn3);
      expect(hooks.add.mostRecentCall.args[2]).toBe(context);
    });

    it('should add hook once as function', function () {
      var hooks = new Handsontable.utils.Hooks();
      var fn1 = function () {};
      var fn2 = function () {};
      var context = {};
      var bucket = {};

      spyOn(hooks, 'add');

      hooks.once('test', fn1, context);
      hooks.once('test', fn2);

      expect(fn1.runOnce).toBe(true);
      expect(fn2.runOnce).toBe(true);
      expect(hooks.add.calls.length).toBe(2);
      expect(hooks.add.calls[0].args[0]).toBe('test')
      expect(hooks.add.calls[0].args[1]).toBe(fn1);
      expect(hooks.add.calls[0].args[2]).toBe(context);
      expect(hooks.add.calls[1].args[0]).toBe('test')
      expect(hooks.add.calls[1].args[1]).toBe(fn2);
      expect(hooks.add.calls[1].args[2]).toBe(null);
    });

    it('should remove hook', function () {
      var hooks = new Handsontable.utils.Hooks();
      var fn1 = function () {};
      var fn2 = function () {};
      var fn3 = function () {};
      var context = {};
      var bucket = {test: [fn1, fn2]};
      var result;

      spyOn(hooks, 'getBucket').andReturn(bucket);

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

    it('should run hook', function () {
      var hooks = new Handsontable.utils.Hooks();
      var fn1 = jasmine.createSpy('fn1').andReturn('Foo');
      var fn2 = jasmine.createSpy('fn2').andReturn('Bar');
      var fn3 = jasmine.createSpy('fn3');
      var context = {};
      var bucket = {test: [fn1, fn2]};
      var result;

      hooks.globalBucket.test = [fn3];

      spyOn(hooks, 'getBucket').andReturn(bucket);
      spyOn(hooks, 'remove');

      result = hooks.run(context, 'test');

      expect(result).toBe('Bar');
      expect(hooks.getBucket).toHaveBeenCalledWith(context);
      expect(hooks.remove).not.toHaveBeenCalled();
      expect(fn1).toHaveBeenCalled();
      expect(fn2).toHaveBeenCalled();
      expect(fn3).toHaveBeenCalled();

      fn1.reset();
      fn1.runOnce = true;
      fn2.reset();
      fn3.reset();
      result = hooks.run(context, 'test', 1, 2, 'AB');

      expect(result).toBe('Bar');
      expect(hooks.remove).toHaveBeenCalledWith('test', fn1, context);
      expect(fn1).toHaveBeenCalledWith(1, 2, 'AB', void 0, void 0, void 0);
      expect(fn2).toHaveBeenCalledWith('Foo', 2, 'AB', void 0, void 0, void 0);
      expect(fn3).toHaveBeenCalledWith(1, 2, 'AB', void 0, void 0, void 0);
    });

    it('should run hooks added as once', function () {
      var hooks = new Handsontable.utils.Hooks();
      var fn1 = jasmine.createSpy('fn1').andReturn('Foo');
      var fn2 = jasmine.createSpy('fn2').andReturn('Bar');
      var fn3 = jasmine.createSpy('fn3');
      var context = {pluginHookBucket: {test: [fn1, fn2]}};
      var result;

      fn1.runOnce = true;
      fn2.runOnce = true;
      fn3.runOnce = true;
      hooks.globalBucket = {test: [fn3]}

      hooks.run(context, 'test');
      hooks.run(context, 'test');
      hooks.run(context, 'test');

      expect(fn1.calls.length).toBe(1);
      expect(fn2.calls.length).toBe(1);
      expect(fn3.calls.length).toBe(1);
    });

    it('should destroy hooks', function () {
      var hooks = new Handsontable.utils.Hooks();
      var fn1 = jasmine.createSpy('fn1').andReturn('Foo');
      var fn2 = jasmine.createSpy('fn2').andReturn('Bar');
      var fn3 = jasmine.createSpy('fn3');
      var context = {};
      var bucket = {test: [fn1, fn2, fn3], test2: [fn3]};

      spyOn(hooks, 'getBucket').andReturn(bucket);

      hooks.destroy(context);

      expect(hooks.getBucket).toHaveBeenCalledWith(context);
      expect(bucket.test.length).toBe(0);
      expect(bucket.test2.length).toBe(0);
    });

    it('should register hook', function () {
      var hooks = new Handsontable.utils.Hooks();

      spyOn(hooks, 'isRegistered').andReturn(false);

      hooks.register('test');

      expect(hooks.isRegistered).toHaveBeenCalledWith('test');
      expect(hooks.getRegistered().indexOf('test')).toBeGreaterThan(-1);

      hooks.isRegistered.andReturn(true);
      hooks.register('test2');

      expect(hooks.isRegistered).toHaveBeenCalledWith('test2');
      expect(hooks.getRegistered().indexOf('test2')).toBe(-1);
    });

    it('should deregister hook', function () {
      var hooks = new Handsontable.utils.Hooks();

      spyOn(hooks, 'isRegistered').andReturn(false);
      hooks.register('test');

      hooks.deregister('test');

      expect(hooks.isRegistered).toHaveBeenCalledWith('test');
      expect(hooks.getRegistered().indexOf('test')).toBeGreaterThan(-1);

      hooks.isRegistered.andReturn(true);
      hooks.deregister('test2');

      expect(hooks.isRegistered).toHaveBeenCalledWith('test2');
      expect(hooks.getRegistered().indexOf('test2')).toBe(-1);
    });

    it('should returns `true` if hooks is registered', function () {
      var hooks = new Handsontable.utils.Hooks();

      hooks.register('test');

      expect(hooks.isRegistered('test')).toBe(true);
      expect(hooks.isRegistered('test2')).toBe(false);
    });

    it('should returns array of registered hooks', function () {
      var hooks = new Handsontable.utils.Hooks();

      expect(hooks.getRegistered().length).toBeGreaterThan(0);
    });
  });


  it('should add a many local hooks at init (as array)', function () {
    var handler1 = jasmine.createSpy('handler1');
    var handler2 = jasmine.createSpy('handler2');
    var handler3 = jasmine.createSpy('handler3');

    handsontable({
      afterInit: [handler1, handler2, handler3]
    });

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
    expect(handler3).toHaveBeenCalled();
  });

  it('should remove a global hook', function () {
    var
      test = 0,
      hook = function () {
        test = 5;
      };

    Handsontable.hooks.add('afterInit', hook);
    Handsontable.hooks.remove('afterInit', hook);

    handsontable();

    expect(test).toEqual(0);
  });

  it('should remove a local hook', function () {
    var
      test = 0,
      hook = function () {
        test = 5;
      };

    handsontable();

    getInstance().addHook('afterInit', hook);
    getInstance().removeHook('afterInit', hook);

    expect(test).toEqual(0);
  });

  it('should run global hook', function () {
    var test = 0;

    Handsontable.hooks.add('afterInit', function () {
      test = 5;
    });
    handsontable();
    expect(test).toEqual(5);
  });

  it('should run local hook', function () {
    var test = 0;

    handsontable();

    getInstance().addHook('myHook', function () {
      test += 5;
    });
    getInstance().runHooks('myHook');
    getInstance().runHooks('myHook');

    expect(test).toEqual(10);
  });

  it('should run local hook once', function () {
    var test = 0;

    handsontable();

    getInstance().addHookOnce('myHook', function () {
      test += 5;
    });
    getInstance().runHooks('myHook');
    getInstance().runHooks('myHook');

    expect(test).toEqual(5);
  });

  it('should run all hooks', function () {
    var test = 0;

    Handsontable.hooks.add('afterInit', function () {
      test += 5;
    });

    handsontable({
      afterInit: function () {
        test += 5;
      }
    });

    expect(test).toEqual(10);
  });

  it('list of all avaliable plugin hooks should be exposed as a public method', function () {
    var hooks = Handsontable.hooks.getRegistered(); //this is used in demo/callbacks.html

    expect(hooks.indexOf('beforeInit')).toBeGreaterThan(-1);
  });

  it('should add a local hook with addHooks method', function(){
    var hot1 = handsontable();

    var test = 0;

    hot1.addHook('myHook', function(){
      test += 5;
    });
    hot1.runHooks('myHook');

    expect(test).toEqual(5);
  });

  it('should remove a local hook with removeHook method', function(){
    var hot1 = handsontable();

    var test = 0;
    var handler = function(){
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

  it('should add a local hook with addHookOnce method and run it just once', function(){
    var hot1 = handsontable();

    var test = 0;
    var handler = function(){
      test += 5;
    };

    hot1.addHookOnce('myHook', handler);

    hot1.runHooks('myHook');
    hot1.runHooks('myHook');
    expect(test).toEqual(5);

  });

  it('should run hook with runHooks and return value', function(){
    var hot = handsontable();

    var handler = function(){
      return 5;
    };

    hot.addHook('myHook', handler);

    expect(hot.runHooks('myHook')).toEqual(5);
  });

  it('should run two "once" hooks in desired order', function(){
    var hot = handsontable();
    var arr = [];

    hot.addHookOnce('myHook', function(){
      arr.push(1);
    });

    hot.addHookOnce('myHook', function(){
      arr.push(2);
    });

    hot.runHooks('myHook');

    expect(arr).toEqual([1,2]);
  });

  it('should execute two "once" hooks in desired order', function(){
    var hot = handsontable();
    var str = 'a';

    hot.addHookOnce('myHook', function(str){
      return str + 'b';
    });

    hot.addHookOnce('myHook', function(str){
      return str + 'c';
    });

    expect(hot.runHooks('myHook', str)).toEqual('abc');
  });

  it('adding same hook twice should register it only once (without an error)', function () {
    var i = 0;
    var fn = function(){
      i++;
    };

    var hot = handsontable({
      afterOnCellMouseOver: fn
    });

    hot.getInstance().updateSettings({afterOnCellMouseOver: fn});
    hot.runHooks('afterOnCellMouseOver');

    expect(i).toEqual(1);
  });

  describe("controlling handler queue execution", function () {
    it("should execute all handlers if none of them hasn't skipped", function () {

      var handler1 = jasmine.createSpy('handler1');
      var handler2 = jasmine.createSpy('handler2');
      var handler3 = jasmine.createSpy('handler3');

      var hot = handsontable();

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
