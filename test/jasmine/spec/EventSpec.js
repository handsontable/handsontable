describe('Handsontable.eventManager', function () {
  it('should add event via addEvent', function () {
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

});
