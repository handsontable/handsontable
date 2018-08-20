import EventManager from 'handsontable/eventManager';

describe('EventManager', () => {
  it('should add/remove/clear event for multiple instances', () => {
    const instance = {
      subinstance: {}
    };
    const instance2 = {};
    const eM0 = new EventManager(instance);
    const eM1 = new EventManager(instance.subinstance);
    const eM2 = new EventManager(instance2);

    expect(instance.eventListeners.length).toEqual(0);

    const test = function() {};
    const test2 = function() {};

    eM0.addEventListener(window, 'click', test, true);
    eM1.addEventListener(window, 'mousedown', test);
    eM2.addEventListener(window, 'mouseup', test, false);
    eM2.addEventListener(window, 'click', test2);

    expect(instance.eventListeners.length).toEqual(1);
    expect(instance.subinstance.eventListeners.length).toEqual(1);
    expect(instance2.eventListeners.length).toEqual(2);

    eM0.removeEventListener(window, 'click', test, true);
    expect(instance.eventListeners.length).toEqual(0);

    eM1.removeEventListener(window);
    expect(instance.subinstance.eventListeners.length).toEqual(1);

    eM1.clear();
    expect(instance.subinstance.eventListeners.length).toEqual(0);

    eM2.clear();
    expect(instance2.eventListeners.length).toEqual(0);
  });

  it('should detect event when fired from hot-table (web component)', () => {
    // skip if browser not support Shadow DOM natively
    if (!document.createElement('div').createShadowRoot) {
      // Fix for "no exceptations" warnings
      expect(true).toBe(true);

      return;
    }
    EventManager.isHotTableEnv = true;
    const instance = {};
    const em = new EventManager(instance);
    const classicHost = document.createElement('div');
    const hotTable = document.createElement('hot-table');

    const shadowHotTable = hotTable.createShadowRoot();
    shadowHotTable.innerHTML = '<span>shadow <inner-custom><p></p></inner-custom></span>';

    const test1 = jasmine.createSpy('test1');
    const test2 = jasmine.createSpy('test2');

    em.addEventListener(classicHost, 'click', test1);
    em.addEventListener(shadowHotTable.querySelector('p'), 'click', test2);
    em.fireEvent(classicHost, 'click');
    em.fireEvent(shadowHotTable.querySelector('p'), 'click');
    em.clear();

    expect(test1.calls.mostRecent().args[0].isTargetWebComponent).toEqual(true);
    expect(test1.calls.count()).toEqual(1);
    expect(test2.calls.count()).toEqual(1);
    expect(test2.calls.mostRecent().args[0].target).toEqual(shadowHotTable.querySelector('p'));

    EventManager.isHotTableEnv = false;
  });

  it('should clear all events', () => {
    const instance = {};
    const em = new EventManager(instance);

    const test = jasmine.createSpy('test');
    const test1 = jasmine.createSpy('test1');

    em.addEventListener(window, 'click', test);
    em.addEventListener(window, 'click', test1);
    em.addEventListener(window, 'click', test1);
    em.fireEvent(window, 'click');

    expect(test.calls.count()).toEqual(1);
    expect(test1.calls.count()).toEqual(2);

    em.clear(window);
    em.fireEvent(window, 'click');

    expect(test.calls.count()).toEqual(1);
    expect(test1.calls.count()).toEqual(2);
  });

  it('should destroy instance', () => {
    const instance = {};
    const em = new EventManager(instance);

    const test = jasmine.createSpy('test');
    const test1 = jasmine.createSpy('test1');

    em.addEventListener(window, 'click', test);
    em.addEventListener(window, 'click', test1);
    em.addEventListener(window, 'click', test1);
    em.fireEvent(window, 'click');

    expect(test.calls.count()).toEqual(1);
    expect(test1.calls.count()).toEqual(2);

    em.destroy(window);
    em.fireEvent(window, 'click');

    expect(test.calls.count()).toEqual(1);
    expect(test1.calls.count()).toEqual(2);
    expect(em.context).toBe(null);
    expect(instance.eventListeners.length).toBe(0);
  });

  it('should fire event', () => {
    const instance = {};
    const em = new EventManager(instance);

    const test = jasmine.createSpy('test');
    const test1 = jasmine.createSpy('test1');

    em.addEventListener(window, 'click', test);
    em.addEventListener(window, 'click', test1);
    em.addEventListener(window, 'click', test1);
    em.fireEvent(window, 'click');

    expect(test.calls.count()).toEqual(1);
    expect(test1.calls.count()).toEqual(2);

    em.fireEvent(window, 'click');

    expect(test.calls.count()).toEqual(2);
    expect(test1.calls.count()).toEqual(4);

    em.clear(window, 'click');
  });

  it('should fire touchend event', () => {
    const instance = {};
    const em = new EventManager(instance);

    const test = jasmine.createSpy('test');
    const test1 = jasmine.createSpy('test1');

    em.addEventListener(window, 'touchend', test);
    em.addEventListener(window, 'touchend', test1);
    em.addEventListener(window, 'touchend', test1);
    em.fireEvent(window, 'touchend');

    expect(test.calls.count()).toEqual(1);
    expect(test1.calls.count()).toEqual(2);

    em.fireEvent(window, 'touchend');

    expect(test.calls.count()).toEqual(2);
    expect(test1.calls.count()).toEqual(4);

    em.clear(window, 'touchend');
  });

  it('should remove event by calling function returned from addEvent', () => {
    const instance = {};
    const em = new EventManager(instance);

    const test = jasmine.createSpy('test');

    const clickRemoveEvent = em.addEventListener(window, 'click', test);
    em.fireEvent(window, 'click');

    expect(test.calls.count()).toEqual(1);
    expect(instance.eventListeners.length).toEqual(1);

    clickRemoveEvent();

    expect(test.calls.count()).toEqual(1);
    expect(instance.eventListeners.length).toEqual(0);
  });
});
