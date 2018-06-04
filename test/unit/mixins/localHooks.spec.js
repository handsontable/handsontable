import localHooks from 'handsontable/mixins/localHooks';

describe('localHooks mixin', () => {
  afterEach(() => {
    localHooks._localHooks = Object.create(null);
  });

  describe('.addLocalHook', () => {
    it('should return itself to make method chainable', () => {
      expect(localHooks.addLocalHook('myHook', () => {})).toBe(localHooks);
    });
  });

  describe('.clearLocalHooks', () => {
    it('should return itself to make method chainable', () => {
      expect(localHooks.clearLocalHooks()).toBe(localHooks);
    });
  });

  it('should have empty collection on init', () => {
    expect(localHooks._localHooks).toEqual(jasmine.any(Object));
  });

  it('should add local hook to the hooks collection', () => {
    const callback = () => {};
    const callback1 = () => {};
    const callback2 = () => {};

    localHooks.addLocalHook('myHook', callback);
    localHooks.addLocalHook('myHook', callback);
    localHooks.addLocalHook('myHook', callback1);
    localHooks.addLocalHook('myHook1', callback2);

    expect(localHooks._localHooks.myHook.length).toBe(3);
    expect(localHooks._localHooks.myHook[0]).toBe(callback);
    expect(localHooks._localHooks.myHook[1]).toBe(callback);
    expect(localHooks._localHooks.myHook[2]).toBe(callback1);
    expect(localHooks._localHooks.myHook1.length).toBe(1);
    expect(localHooks._localHooks.myHook1[0]).toBe(callback2);
  });

  it('should run local hooks registered in collection', () => {
    const callback = jasmine.createSpy();
    const callback1 = jasmine.createSpy();
    const callback2 = jasmine.createSpy();
    const myArray = [1, 2];

    localHooks._localHooks.myHook = [callback, callback1];
    localHooks._localHooks.myHook1 = [callback, callback2];

    localHooks.runLocalHooks('myHook');
    localHooks.runLocalHooks('myHook1', 'foo', 'bar', myArray);

    expect(callback.calls.count()).toBe(2);
    expect(callback.calls.argsFor(0)).toEqual([]);
    expect(callback.calls.argsFor(1)).toEqual(['foo', 'bar', [1, 2]]);
    expect(callback).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith('foo', 'bar', [1, 2]);
  });

  it('should clear all registered hooks from collection', () => {
    const callback = () => {};
    const callback1 = () => {};
    const callback2 = () => {};

    localHooks._localHooks.myHook = [callback, callback1];
    localHooks._localHooks.myHook1 = [callback, callback2];

    localHooks.clearLocalHooks();

    expect(localHooks._localHooks).toEqual(jasmine.any(Object));
  });
});
