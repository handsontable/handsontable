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

  it('should add a global hook', function () {
    var errors = 0;

    try {
      Handsontable.PluginHooks.add('afterInit', function () {
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
      getInstance().PluginHooks.add('afterInit', function () {
      });
    } catch (e) {
      errors++;
    }

    expect(errors).toEqual(0);
  });

  it('should add a local hook at init', function () {
    var test = 0;

    handsontable({
      afterInit: function () {
        test = 5;
      }
    });

    expect(test).toEqual(5);
  });

  it('should add a many local hooks at init', function () {
    var test = 0;

    handsontable({
      afterInit: [function () {
        test = 5;
      }, function () {
        test++;
      }, function () {
        test += 3;
      }]
    });

    expect(test).toEqual(9);
  });

  it('should remove a global hook', function () {
    var test = 0
      , hook = function () {
        test = 5;
      };

    Handsontable.PluginHooks.add('afterInit', hook);
    Handsontable.PluginHooks.remove('afterInit', hook);

    handsontable();

    expect(test).toEqual(0);
  });

  it('should remove a local hook', function () {
    var test = 0
      , hook = function () {
        test = 5;
      };

    handsontable();

    getInstance().PluginHooks.add('afterInit', hook);
    getInstance().PluginHooks.remove('afterInit', hook);

    expect(test).toEqual(0);
  });

  it('should run global hook', function () {
    var test = 0;
    Handsontable.PluginHooks.add('afterInit', function () {
      test = 5;
    });
    handsontable();
    expect(test).toEqual(5);
  });

  it('should run local hook', function () {
    var test = 0;

    handsontable();

    getInstance().PluginHooks.add('myHook', function () {
      test += 5;
    });
    getInstance().PluginHooks.run('myHook');
    getInstance().PluginHooks.run('myHook');

    expect(test).toEqual(10);
  });

  it('should run local hook once', function () {
    var test = 0;

    handsontable();

    getInstance().PluginHooks.once('myHook', function () {
      test += 5;
    });
    getInstance().PluginHooks.run('myHook');
    getInstance().PluginHooks.run('myHook');

    expect(test).toEqual(5);
  });

  it('should run all hooks', function () {
    var test = 0;

    Handsontable.PluginHooks.add('afterInit', function () {
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

    Handsontable.PluginHooks.add('afterInit', function () {
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
    var pluginHooks = Handsontable.PluginHooks.hooks.persistent; //this is used in demo/callbacks.html

    expect(pluginHooks.beforeInit).toBeDefined(); //duck check is fine

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

  it('should run hook with runHooksAndReturn and return value', function(){
    var hot = handsontable();

    var handler = function(){
      return 5;
    };

    hot.addHook('myHook', handler);

    expect(hot.runHooksAndReturn('myHook')).toEqual(5);

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

    expect(hot.runHooksAndReturn('myHook', str)).toEqual('abc');
  });
});
