import { ChangesObserver } from 'handsontable/translations/changesObservable/observer';

describe('ChangesObserver', () => {
  describe('subscribe', () => {
    it('should call the callback when the "change" hook is triggered', () => {
      const subscribeSpy = jasmine.createSpy();
      const observer = new ChangesObserver();

      observer.subscribe(subscribeSpy);

      observer.runLocalHooks('change', [
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);

      expect(subscribeSpy.calls.count()).toBe(1);
      expect(subscribeSpy).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);

      observer.runLocalHooks('change', 'test');

      expect(subscribeSpy.calls.count()).toBe(2);
      expect(subscribeSpy).toHaveBeenLastCalledWith('test');
    });

    it('should be possible to subscribe multiple times to the same observer', () => {
      const subscribeSpy1 = jasmine.createSpy();
      const subscribeSpy2 = jasmine.createSpy();
      const subscribeSpy3 = jasmine.createSpy();
      const observer = new ChangesObserver();

      observer.subscribe(subscribeSpy1);
      observer.subscribe(subscribeSpy2);
      observer.subscribe(subscribeSpy3);

      observer.runLocalHooks('change', [
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);

      expect(subscribeSpy1.calls.count()).toBe(1);
      expect(subscribeSpy2.calls.count()).toBe(1);
      expect(subscribeSpy3.calls.count()).toBe(1);
      expect(subscribeSpy1).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);
      expect(subscribeSpy2).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);
      expect(subscribeSpy3).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);

      observer.runLocalHooks('change', 'test');

      expect(subscribeSpy1.calls.count()).toBe(2);
      expect(subscribeSpy2.calls.count()).toBe(2);
      expect(subscribeSpy3.calls.count()).toBe(2);
      expect(subscribeSpy1).toHaveBeenLastCalledWith('test');
      expect(subscribeSpy2).toHaveBeenLastCalledWith('test');
      expect(subscribeSpy3).toHaveBeenLastCalledWith('test');
    });
  });

  describe('unsubscribe', () => {
    it('should stop emitting changes when it\'s called', () => {
      const subscribeSpy1 = jasmine.createSpy();
      const subscribeSpy2 = jasmine.createSpy();
      const observer = new ChangesObserver();

      observer.subscribe(subscribeSpy1);
      observer.subscribe(subscribeSpy2);

      observer.runLocalHooks('change', [
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);

      expect(subscribeSpy1.calls.count()).toBe(1);
      expect(subscribeSpy2.calls.count()).toBe(1);
      expect(subscribeSpy1).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);
      expect(subscribeSpy2).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);

      observer.unsubscribe();
      observer.runLocalHooks('change', 'test');

      expect(subscribeSpy1.calls.count()).toBe(1);
      expect(subscribeSpy2.calls.count()).toBe(1);
    });

    it('should trigger local "unsubscribe" hook when it\'s called', () => {
      const unsubscribeSpy = jasmine.createSpy();
      const observer = new ChangesObserver();

      observer.addLocalHook('unsubscribe', unsubscribeSpy);

      observer.unsubscribe();
      observer.runLocalHooks('change', 'test');

      expect(unsubscribeSpy.calls.count()).toBe(1);
    });
  });

  describe('_write', () => {
    it('should trigger local "change" hook when it\'s called with chunk of changes', () => {
      const changesSpy = jasmine.createSpy();
      const observer = new ChangesObserver();

      observer.addLocalHook('change', changesSpy);

      observer._write({
        callerMapName: 'MyHidingPlugin',
        changes: [
          { op: 'replace', index: 3, oldValue: false, newValue: true },
        ]
      });

      expect(changesSpy.calls.count()).toBe(1);
      expect(changesSpy).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);

      observer._write({
        callerMapName: 'MyHidingPlugin2',
        changes: [
          { op: 'replace', index: 30, oldValue: true, newValue: true },
        ]
      });

      expect(changesSpy.calls.count()).toBe(2);
      expect(changesSpy).toHaveBeenLastCalledWith([
        { op: 'replace', index: 30, oldValue: true, newValue: true },
      ]);

      observer._write({
        callerMapName: 'MyHidingPlugin',
        changes: [
          { op: 'replace', index: 2, oldValue: true, newValue: false },
          { op: 'replace', index: 3, oldValue: true, newValue: false },
          { op: 'replace', index: 4, oldValue: false, newValue: true },
        ]
      });

      expect(changesSpy.calls.count()).toBe(3);
      expect(changesSpy).toHaveBeenLastCalledWith([
        { op: 'replace', index: 2, oldValue: true, newValue: false },
        { op: 'replace', index: 3, oldValue: true, newValue: false },
        { op: 'replace', index: 4, oldValue: false, newValue: true },
      ]);
    });

    it('should ignore changes that comes from the map name that is configured as ignore', () => {
      const changesSpy = jasmine.createSpy();
      const observer = new ChangesObserver({
        mapNamesIgnoreList: ['MyHidingPlugin', 'MyHidingPlugin4'],
      });

      observer.addLocalHook('change', changesSpy);

      observer._write({
        callerMapName: 'MyHidingPlugin',
        changes: [
          { op: 'replace', index: 3, oldValue: false, newValue: true },
        ]
      });

      expect(changesSpy.calls.count()).toBe(0);

      observer._write({
        callerMapName: 'MyHidingPlugin2',
        changes: [
          { op: 'replace', index: 30, oldValue: true, newValue: true },
        ]
      });

      expect(changesSpy.calls.count()).toBe(1);
      expect(changesSpy).toHaveBeenLastCalledWith([
        { op: 'replace', index: 30, oldValue: true, newValue: true },
      ]);

      observer._write({
        callerMapName: 'MyHidingPlugin',
        changes: [
          { op: 'replace', index: 2, oldValue: true, newValue: false },
          { op: 'replace', index: 3, oldValue: true, newValue: false },
          { op: 'replace', index: 4, oldValue: false, newValue: true },
        ]
      });

      expect(changesSpy.calls.count()).toBe(1);

      observer._write({
        callerMapName: 'MyHidingPlugin2',
        changes: [
          { op: 'multiple', oldValue: [1, 2, 3], newValue: [6, 5, 3] },
        ]
      });

      expect(changesSpy.calls.count()).toBe(2);
      expect(changesSpy).toHaveBeenLastCalledWith([
        { op: 'multiple', oldValue: [1, 2, 3], newValue: [6, 5, 3] },
      ]);
    });
  });
});
