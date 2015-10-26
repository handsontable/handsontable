describe('localHooks mixin', function() {
  it('should have empty collection on init', function() {
    var localHooks = Handsontable.utils.localHooks;

    expect(localHooks._localHooks).toEqual({});
  });

  it('should add local hook to the hooks collection', function() {
    var localHooks = Handsontable.utils.localHooks;
    var callback = function() {};
    var callback1 = function() {};
    var callback2 = function() {};

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

  it('should run local hooks registered in collection', function() {
    var localHooks = Handsontable.utils.localHooks;
    var callback = jasmine.createSpy();
    var callback1 = jasmine.createSpy();
    var callback2 = jasmine.createSpy();
    var myArray = [1, 2];

    localHooks._localHooks.myHook = [callback, callback1];
    localHooks._localHooks.myHook1 = [callback, callback2];

    localHooks.runLocalHooks('myHook');
    localHooks.runLocalHooks('myHook1', 'foo', 'bar', myArray);

    expect(callback.calls.length).toBe(2);
    expect(callback.calls[0].args).toEqual([]);
    expect(callback.calls[1].args).toEqual(['foo', 'bar', [1, 2]]);
    expect(callback).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith('foo', 'bar', [1, 2]);
  });

  it('should clear all registered hooks from collection', function() {
    var localHooks = Handsontable.utils.localHooks;
    var callback = jasmine.createSpy();
    var callback1 = jasmine.createSpy();
    var callback2 = jasmine.createSpy();

    localHooks._localHooks.myHook = [callback, callback1];
    localHooks._localHooks.myHook1 = [callback, callback2];

    localHooks.clearLocalHooks();

    expect(localHooks._localHooks).toEqual({});
  });
});
