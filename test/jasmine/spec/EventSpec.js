describe('Handsontable.eventManager', function () {
  it('should add/remove/clear event for multiple instances', function () {
    var instance = {
      subinstance: {}
    };
    var instance2 = {};
    var eM0 = Handsontable.eventManager(instance);
    var eM1 = Handsontable.eventManager(instance.subinstance);
    var eM2 = Handsontable.eventManager(instance2);

    expect(instance.eventListeners.length).toEqual(0);

    var test = function () {};
    var test2 = function () {};

    eM0.addEventListener(window,'click',test, true);
    eM1.addEventListener(window,'mousedown',test);
    eM2.addEventListener(window,'mouseup', test,false);
    eM2.addEventListener(window,'click', test2);

    expect(instance.eventListeners.length).toEqual(1);
    expect(instance.subinstance.eventListeners.length).toEqual(1);
    expect(instance2.eventListeners.length).toEqual(2);

    eM0.removeEventListener(window,'click',test,true);
    expect(instance.eventListeners.length).toEqual(0);

    eM1.removeEventListener(window);
    expect(instance.subinstance.eventListeners.length).toEqual(1);

    eM1.clear();
    expect(instance.subinstance.eventListeners.length).toEqual(0);

    eM2.clear();
    expect(instance2.eventListeners.length).toEqual(0);
  });

  it('should detect event when fired from hot-table (web component)', function () {
    // skip if browser not support Shadow DOM natively
    if (!document.createElement('div').createShadowRoot) {
      return;
    }
    Handsontable.eventManager.isHotTableEnv = true;
    var instance = {};
    var em = Handsontable.eventManager(instance);
    var classicHost = document.createElement('div');
    var hotTable = document.createElement('hot-table');

    var shadowHotTable = hotTable.createShadowRoot();
    shadowHotTable.innerHTML = '<span>shadow <inner-custom><p></p></inner-custom></span>';

    var test1 = jasmine.createSpy('test1');
    var test2 = jasmine.createSpy('test2');

    em.addEventListener(classicHost, 'click', test1);
    em.addEventListener(shadowHotTable.querySelector('p'), 'click', test2);
    em.fireEvent(classicHost, 'click');
    em.fireEvent(shadowHotTable.querySelector('p'), 'click');
    em.clear();

    expect(test1.mostRecentCall.args[0].isTargetWebComponent).toEqual(true);
    expect(test1.calls.length).toEqual(1);
    expect(test2.calls.length).toEqual(1);
    expect(test2.mostRecentCall.args[0].target).toEqual(shadowHotTable.querySelector('p'));

    Handsontable.eventManager.isHotTableEnv = false;
  });

  it('should clear all events', function () {
    var instance = {};
    var em = Handsontable.eventManager(instance);

    var test = jasmine.createSpy('test');
    var test1 = jasmine.createSpy('test1');

    em.addEventListener(window, 'click', test);
    em.addEventListener(window, 'click', test1);
    em.addEventListener(window, 'click', test1);
    em.fireEvent(window, 'click');

    expect(test.calls.length).toEqual(1);
    expect(test1.calls.length).toEqual(2);

    em.clear(window);
    em.fireEvent(window, 'click');

    expect(test.calls.length).toEqual(1);
    expect(test1.calls.length).toEqual(2);
  });

  it('should fire event', function () {
    var instance = {};
    var em = Handsontable.eventManager(instance);

    var test = jasmine.createSpy('test');
    var test1 = jasmine.createSpy('test1');

    em.addEventListener(window, 'click', test);
    em.addEventListener(window, 'click', test1);
    em.addEventListener(window, 'click', test1);
    em.fireEvent(window, 'click');

    expect(test.calls.length).toEqual(1);
    expect(test1.calls.length).toEqual(2);

    em.fireEvent(window, 'click');

    expect(test.calls.length).toEqual(2);
    expect(test1.calls.length).toEqual(4);

    em.clear(window, 'click');
  });

  it('should remove event by calling function returned from addEvent', function () {
    var instance = {};
    var em = Handsontable.eventManager(instance);

    var test = jasmine.createSpy('test');

    var clickRemoveEvent = em.addEventListener(window, 'click', test);
    em.fireEvent(window, 'click');

    expect(test.calls.length).toEqual(1);
    expect(instance.eventListeners.length).toEqual(1);

    clickRemoveEvent();

    expect(test.calls.length).toEqual(1);
    expect(instance.eventListeners.length).toEqual(0);
  });

});
