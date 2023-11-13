import hooksRefRegisterer from 'handsontable/mixins/hooksRefRegisterer';

describe('hooksRegisterer mixin', () => {
  beforeEach(() => {
    hooksRefRegisterer.hot = {
      addHook() {},
      removeHook() {},
    };
  });

  it('should have empty collection on init', () => {
    expect(hooksRefRegisterer._hooksStorage).toEqual(jasmine.any(Object));
  });

  it('should add local hook to the hooks collection', () => {
    const callback = () => {};
    const callback1 = () => {};
    const callback2 = () => {};

    hooksRefRegisterer.addHook('myHook', callback);
    hooksRefRegisterer.addHook('myHook', callback);
    hooksRefRegisterer.addHook('myHook', callback1);
    hooksRefRegisterer.addHook('myHook1', callback2);

    expect(hooksRefRegisterer._hooksStorage.myHook.length).toBe(3);
    expect(hooksRefRegisterer._hooksStorage.myHook[0]).toBe(callback);
    expect(hooksRefRegisterer._hooksStorage.myHook[1]).toBe(callback);
    expect(hooksRefRegisterer._hooksStorage.myHook[2]).toBe(callback1);
    expect(hooksRefRegisterer._hooksStorage.myHook1.length).toBe(1);
    expect(hooksRefRegisterer._hooksStorage.myHook1[0]).toBe(callback2);
  });

  it('should clear all registered hooks from collection', () => {
    const callback = () => {};
    const callback1 = () => {};
    const callback2 = () => {};

    hooksRefRegisterer._hooksStorage.myHook = [callback, callback1];
    hooksRefRegisterer._hooksStorage.myHook1 = [callback, callback2];

    hooksRefRegisterer.clearHooks();

    expect(Object.keys(hooksRefRegisterer._hooksStorage).length).toEqual(0);
  });
});
