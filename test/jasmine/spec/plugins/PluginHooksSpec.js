describe('hooks', function () {
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

  it('should add a global hook', function () {
    var errors = 0;

    try {
      Handsontable.hooks.add('afterInit', function () {
      });
    } catch (e) {
      errors++;
    }

    expect(errors).toEqual(0);
  });

  it('should add a local hook', function () {
    var errors = 0;
    handsontable();

    try {
      getInstance().addHook('afterInit', function () {
      });
    } catch (e) {
      errors++;
    }

    expect(errors).toEqual(0);
  });

  it('should add a local hook at init', function () {
    var afterInitHandler = jasmine.createSpy('afterInitHandler');

    handsontable({
      afterInit: afterInitHandler
    });

    expect(afterInitHandler).toHaveBeenCalled();
    expect(afterInitHandler.calls.length).toEqual(1);
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
    var test = 0
      , hook = function () {
        test = 5;
      };

    Handsontable.hooks.add('afterInit', hook);
    Handsontable.hooks.remove('afterInit', hook);

    handsontable();

    expect(test).toEqual(0);
  });

  it('should remove a local hook', function () {
    var test = 0
      , hook = function () {
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

  it('list of all avaliable plugin hooks should be exposed as a public object', function () {
    var hooks = Handsontable.hooks.hooks; //this is used in demo/callbacks.html

    expect(hooks.beforeInit).toBeDefined(); //duck check is fine

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

    it("should stop executing handlers if one of them is skipped", function () {
      var handler1 = jasmine.createSpy('handler1');
      var handler2 = jasmine.createSpy('handler2');

      handler2.plan = function () {
        return false;
      };

      var handler3 = jasmine.createSpy('handler3');

      var hot = handsontable();

      hot.addHook('fakeEvent', handler1);
      hot.addHook('fakeEvent', handler2);
      handler2.skip = true;
      hot.addHook('fakeEvent', handler3);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();

      hot.runHooks('fakeEvent');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });
  });

  describe("registering hooks", function() {
    describe("getRegistered", function() {
      it("should be an array that contains build-in hooks", function() {
        var hooks = Handsontable.hooks.getRegistered();
        expect(Array.isArray(hooks)).toBe(true);
        expect('afterInit').toBeInArray(hooks);
      });
    });

    describe("isRegistered", function() {
      it("should return information if a hook has been registered", function() {
        expect(Handsontable.hooks.isRegistered('afterInit')).toBe(true);
      });
    });

    describe("register", function() {
      it("should register a new hook name", function() {
        var hooks;

        expect(Handsontable.hooks.isRegistered('afterMyOwnHook')).toBe(false);
        hooks = Handsontable.hooks.getRegistered();
        expect('afterMyOwnHook').not.toBeInArray(hooks);

        Handsontable.hooks.register('afterMyOwnHook');
        expect(Handsontable.hooks.isRegistered('afterMyOwnHook')).toBe(true);
        hooks = Handsontable.hooks.getRegistered();
        expect('afterMyOwnHook').toBeInArray(hooks);
      });
    });

    describe("deregister", function() {
      it("should deregister a known hook name", function() {
        var hooks;

        Handsontable.hooks.register('afterMyOwnHook');
        expect(Handsontable.hooks.isRegistered('afterMyOwnHook')).toBe(true);
        hooks = Handsontable.hooks.getRegistered();
        expect('afterMyOwnHook').toBeInArray(hooks);

        Handsontable.hooks.deregister('afterMyOwnHook');
        expect(Handsontable.hooks.isRegistered('afterMyOwnHook')).toBe(false);
        hooks = Handsontable.hooks.getRegistered();
        expect('afterMyOwnHook').not.toBeInArray(hooks);
      });
    });
  });
});
