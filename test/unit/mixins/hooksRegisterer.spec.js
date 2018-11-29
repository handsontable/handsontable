import hooksRegisterer from 'handsontable/mixins/hooksRegisterer';

describe('hooksRegisterer mixin', () => {
  beforeEach(() => {
    hooksRegisterer.hot = {
      addHook() {},
      removeHook() {},
    };
  });

  it('should have empty collection on init', () => {
    expect(hooksRegisterer._hooksStorage).toEqual(jasmine.any(Object));
  });

  it('should add local hook to the hooks collection', () => {
    const callback = () => {};
    const callback1 = () => {};
    const callback2 = () => {};

    hooksRegisterer.addHook('myHook', callback);
    hooksRegisterer.addHook('myHook', callback);
    hooksRegisterer.addHook('myHook', callback1);
    hooksRegisterer.addHook('myHook1', callback2);

    expect(hooksRegisterer._hooksStorage.myHook.length).toBe(3);
    expect(hooksRegisterer._hooksStorage.myHook[0]).toBe(callback);
    expect(hooksRegisterer._hooksStorage.myHook[1]).toBe(callback);
    expect(hooksRegisterer._hooksStorage.myHook[2]).toBe(callback1);
    expect(hooksRegisterer._hooksStorage.myHook1.length).toBe(1);
    expect(hooksRegisterer._hooksStorage.myHook1[0]).toBe(callback2);
  });

  it('should clear all registered hooks from collection', () => {
    const callback = () => {};
    const callback1 = () => {};
    const callback2 = () => {};

    hooksRegisterer._hooksStorage.myHook = [callback, callback1];
    hooksRegisterer._hooksStorage.myHook1 = [callback, callback2];

    hooksRegisterer.clearHooks();

    expect(hooksRegisterer._hooksStorage).toEqual(jasmine.any(Object));
  });
});
