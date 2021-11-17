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

      expect(subscribeSpy).toHaveBeenCalledTimes(1);
      expect(subscribeSpy).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);

      observer.runLocalHooks('change', 'test');

      expect(subscribeSpy).toHaveBeenCalledTimes(2);
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

      expect(subscribeSpy1).toHaveBeenCalledTimes(1);
      expect(subscribeSpy2).toHaveBeenCalledTimes(1);
      expect(subscribeSpy3).toHaveBeenCalledTimes(1);
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

      expect(subscribeSpy1).toHaveBeenCalledTimes(2);
      expect(subscribeSpy2).toHaveBeenCalledTimes(2);
      expect(subscribeSpy3).toHaveBeenCalledTimes(2);
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

      expect(subscribeSpy1).toHaveBeenCalledTimes(1);
      expect(subscribeSpy2).toHaveBeenCalledTimes(1);
      expect(subscribeSpy1).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);
      expect(subscribeSpy2).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);

      observer.unsubscribe();
      observer.runLocalHooks('change', 'test');

      expect(subscribeSpy1).toHaveBeenCalledTimes(1);
      expect(subscribeSpy2).toHaveBeenCalledTimes(1);
    });

    it('should trigger local "unsubscribe" hook when it\'s called', () => {
      const unsubscribeSpy = jasmine.createSpy();
      const observer = new ChangesObserver();

      observer.addLocalHook('unsubscribe', unsubscribeSpy);

      observer.unsubscribe();
      observer.runLocalHooks('change', 'test');

      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('_write', () => {
    it('should trigger local "change" hook when it\'s called with changes', () => {
      const changesSpy = jasmine.createSpy();
      const observer = new ChangesObserver();

      observer.addLocalHook('change', changesSpy);

      observer._write([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);

      expect(changesSpy).toHaveBeenCalledTimes(1);
      expect(changesSpy).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);

      observer._write([
        { op: 'replace', index: 30, oldValue: true, newValue: true },
      ]);

      expect(changesSpy).toHaveBeenCalledTimes(2);
      expect(changesSpy).toHaveBeenLastCalledWith([
        { op: 'replace', index: 30, oldValue: true, newValue: true },
      ]);

      observer._write([
        { op: 'replace', index: 2, oldValue: true, newValue: false },
        { op: 'replace', index: 3, oldValue: true, newValue: false },
        { op: 'replace', index: 4, oldValue: false, newValue: true },
      ]);

      expect(changesSpy).toHaveBeenCalledTimes(3);
      expect(changesSpy).toHaveBeenLastCalledWith([
        { op: 'replace', index: 2, oldValue: true, newValue: false },
        { op: 'replace', index: 3, oldValue: true, newValue: false },
        { op: 'replace', index: 4, oldValue: false, newValue: true },
      ]);
    });

    it('should not trigger local "change" hook when the changes are empty', () => {
      const changesSpy = jasmine.createSpy();
      const observer = new ChangesObserver();

      observer.addLocalHook('change', changesSpy);
      observer._write([]);

      expect(changesSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('_writeInitialChanges', () => {
    it('should call the subscriber with changes when there are some initial changes queued', () => {
      const subscribeSpy = jasmine.createSpy();
      const observer = new ChangesObserver();

      observer._writeInitialChanges([
        { op: 'insert', index: 1, oldValue: 4, newValue: 7 }
      ]);

      observer.subscribe(subscribeSpy);

      expect(subscribeSpy).toHaveBeenCalledTimes(1);
      expect(subscribeSpy).toHaveBeenLastCalledWith([
        { op: 'insert', index: 1, oldValue: 4, newValue: 7 }
      ]);

      observer._writeInitialChanges([
        { op: 'insert', index: 2, oldValue: 7, newValue: 2 }
      ]);

      expect(subscribeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
