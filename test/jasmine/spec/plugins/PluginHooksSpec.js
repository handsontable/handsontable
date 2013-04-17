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
      Handsontable.PluginHooks.add('afterInit', function () {});
    } catch (e) {
      errors++;
    }

    expect(errors).toEqual(0);
  });

  it('should add a local hook', function () {
    var errors = 0;
    handsontable();

    try {
      getInstance().addHook('afterInit', function () {});
    } catch (e) {
      errors++;
    }

    expect(errors).toEqual(0);
  });

  it('should add a local hook at init', function () {
    var test = 0;

    handsontable({
      'afterInit' : function () {
        test = 5;
      }
    });

    expect(test).toEqual(5);
  });

  it('should add a many local hooks at init', function () {
    var test = 0;

    handsontable({
      'afterInit' : [function () {
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

    getInstance().addHook('afterInit', hook);
    getInstance().removeHook('afterInit', hook);

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

    getInstance().addHook('myHook', function () {
      test = 5;
    });
    getInstance().runHooks('myHook');

    expect(test).toEqual(5);
  });

  it('should run all hooks', function () {
    var test = 0;

    Handsontable.PluginHooks.add('afterInit', function () {
      test += 5;
    });

    handsontable({
      'afterInit' : function () {
        test += 5;
      }
    });

    expect(test).toEqual(10);

  });

});
