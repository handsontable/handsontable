import {
  IndexMapper,
} from 'handsontable/translations';

describe('IndexMapper integrated with ChangesObservable', () => {
  describe('for hidden map types', () => {
    it('should emit the changes that occur in the hidden map collection (one registered hidden map)', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const observer = indexMapper.createChangesObserver('hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      observer.subscribe(observerListener);
      indexMapper.initToLength(5);

      hidingMap1.setValueAtIndex(2, true);

      expect(observerListener).toHaveBeenCalledTimes(1);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 2, oldValue: false, newValue: true },
      ]);

      hidingMap1.setValueAtIndex(4, true);
      hidingMap1.setValueAtIndex(2, false);

      expect(observerListener).toHaveBeenCalledTimes(3);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 2, oldValue: true, newValue: false },
      ]);
    });

    it('should emit the changes that occur in the hidden map collection (multiple registered hidden maps)', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const hidingMap2 = indexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');
      const hidingMap3 = indexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');
      const observer = indexMapper.createChangesObserver('hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      observer.subscribe(observerListener);
      indexMapper.initToLength(5);

      hidingMap1.setValueAtIndex(2, true);
      hidingMap2.setValueAtIndex(3, true);
      hidingMap3.setValueAtIndex(0, true);

      expect(observerListener).toHaveBeenCalledTimes(3);
      expect(observerListener.calls.argsFor(0)).toEqual([
        [{ op: 'replace', index: 2, oldValue: false, newValue: true }],
      ]);
      expect(observerListener.calls.argsFor(1)).toEqual([
        [{ op: 'replace', index: 3, oldValue: false, newValue: true }],
      ]);
      expect(observerListener.calls.argsFor(2)).toEqual([
        [{ op: 'replace', index: 0, oldValue: false, newValue: true }],
      ]);

      hidingMap1.setValueAtIndex(1, true);
      hidingMap1.setValueAtIndex(2, false);
      hidingMap3.setValueAtIndex(3, true);

      expect(observerListener).toHaveBeenCalledTimes(5);
      expect(observerListener.calls.argsFor(3)).toEqual([
        [{ op: 'replace', index: 1, oldValue: false, newValue: true }],
      ]);
      expect(observerListener.calls.argsFor(4)).toEqual([
        [{ op: 'replace', index: 2, oldValue: true, newValue: false }],
      ]);

      hidingMap2.setValueAtIndex(1, false);
      hidingMap1.setValueAtIndex(2, false);
      hidingMap3.setValueAtIndex(3, false);
      hidingMap3.setValueAtIndex(4, false);
      hidingMap3.setValueAtIndex(0, false);

      expect(observerListener).toHaveBeenCalledTimes(6);
      expect(observerListener.calls.argsFor(5)).toEqual([
        [{ op: 'replace', index: 0, oldValue: true, newValue: false }],
      ]);
    });

    it('should emit the changes that occur in the hidden map collection when the index changes are batched', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const observer = indexMapper.createChangesObserver('hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      observer.subscribe(observerListener);
      indexMapper.initToLength(5);

      indexMapper.suspendOperations();
      hidingMap1.setValueAtIndex(2, true);
      hidingMap1.setValueAtIndex(0, true);
      hidingMap1.setValueAtIndex(4, true);
      indexMapper.resumeOperations();

      expect(observerListener).toHaveBeenCalledTimes(1);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 0, oldValue: false, newValue: true },
        { op: 'replace', index: 2, oldValue: false, newValue: true },
        { op: 'replace', index: 4, oldValue: false, newValue: true },
      ]);

      indexMapper.suspendOperations();
      hidingMap1.setValueAtIndex(2, false);
      hidingMap1.setValueAtIndex(0, true);
      hidingMap1.setValueAtIndex(1, true);
      indexMapper.resumeOperations();

      expect(observerListener).toHaveBeenCalledTimes(2);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 1, oldValue: false, newValue: true },
        { op: 'replace', index: 2, oldValue: true, newValue: false },
      ]);
    });

    it('should emit the changes when the new index map is created and it modifies the indexes', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const observer = indexMapper.createChangesObserver('hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      observer.subscribe(observerListener);
      indexMapper.initToLength(5);

      hidingMap1.setValueAtIndex(2, true);

      expect(observerListener).toHaveBeenCalledTimes(1);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 2, oldValue: false, newValue: true },
      ]);

      const hidingMap2 = indexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');

      hidingMap2.setValueAtIndex(3, true);

      expect(observerListener).toHaveBeenCalledTimes(2);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: false, newValue: true },
      ]);

      const hidingMap3 = indexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');

      hidingMap3.setValueAtIndex(0, true);

      expect(observerListener).toHaveBeenCalledTimes(3);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 0, oldValue: false, newValue: true },
      ]);
    });

    it('should not emit the changes when the state between the current and the previous one is the same', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const hidingMap2 = indexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');
      const hidingMap3 = indexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');
      const observer = indexMapper.createChangesObserver('hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      observer.subscribe(observerListener);
      indexMapper.initToLength(5);

      indexMapper.suspendOperations();
      hidingMap1.setValueAtIndex(2, true);
      hidingMap2.setValueAtIndex(4, true);
      hidingMap3.setValueAtIndex(4, true);
      indexMapper.resumeOperations();

      expect(observerListener).toHaveBeenCalledTimes(1);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 2, oldValue: false, newValue: true },
        { op: 'replace', index: 4, oldValue: false, newValue: true },
      ]);

      indexMapper.suspendOperations();
      hidingMap1.setValueAtIndex(2, true);
      hidingMap2.setValueAtIndex(4, true);
      hidingMap3.setValueAtIndex(4, false);
      indexMapper.resumeOperations();

      expect(observerListener).toHaveBeenCalledTimes(1);

      indexMapper.suspendOperations();
      hidingMap1.setValueAtIndex(2, true);
      hidingMap2.setValueAtIndex(4, false);
      hidingMap3.setValueAtIndex(4, true);
      indexMapper.resumeOperations();

      expect(observerListener).toHaveBeenCalledTimes(1);
    });

    it('should emit the initial state changes of the hiding columns after subscribing the observer', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const hidingMap2 = indexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');
      const hidingMap3 = indexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      indexMapper.initToLength(5);

      hidingMap1.setValueAtIndex(2, true);
      hidingMap2.setValueAtIndex(4, true);
      hidingMap3.setValueAtIndex(0, true);

      const observer = indexMapper.createChangesObserver('hiding');

      observer.subscribe(observerListener);

      expect(observerListener).toHaveBeenCalledTimes(1);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 0, oldValue: false, newValue: true },
        { op: 'replace', index: 2, oldValue: false, newValue: true },
        { op: 'replace', index: 4, oldValue: false, newValue: true },
      ]);
    });

    it('should emit the changes when the unregistered hidden map affects the results of the hidden map collection', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const hidingMap2 = indexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');
      const hidingMap3 = indexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');
      const hidingMap4 = indexMapper.createAndRegisterIndexMap('my-hiding-map4', 'hiding');

      indexMapper.initToLength(5);

      hidingMap1.setValueAtIndex(4, true);
      hidingMap2.setValueAtIndex(2, true);
      hidingMap3.setValueAtIndex(0, true);
      hidingMap4.setValueAtIndex(0, true);

      const observer = indexMapper.createChangesObserver('hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      observer.subscribe(observerListener);

      expect(observerListener).toHaveBeenCalledTimes(1);

      indexMapper.unregisterMap('my-hiding-map3');

      expect(observerListener).toHaveBeenCalledTimes(1);

      indexMapper.unregisterMap('my-hiding-map2');

      expect(observerListener).toHaveBeenCalledTimes(2);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 2, oldValue: true, newValue: false },
      ]);

      indexMapper.unregisterMap('my-hiding-map1');

      expect(observerListener).toHaveBeenCalledTimes(3);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 4, oldValue: true, newValue: false },
      ]);

      indexMapper.unregisterMap('my-hiding-map4');

      expect(observerListener).toHaveBeenCalledTimes(4);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 0, oldValue: true, newValue: false },
      ]);
    });

    it('should emit the changes when the index mapper length is changed (emulation of loading bigger dataset)', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const hidingMap2 = indexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');
      const hidingMap3 = indexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');

      indexMapper.initToLength(5);

      hidingMap1.setValueAtIndex(2, true);
      hidingMap2.setValueAtIndex(3, true);
      hidingMap3.setValueAtIndex(0, true);

      const observer = indexMapper.createChangesObserver('hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      observer.subscribe(observerListener);

      expect(observerListener).toHaveBeenCalledTimes(1);

      indexMapper.initToLength(8);

      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 0, oldValue: true, newValue: false },
        { op: 'replace', index: 2, oldValue: true, newValue: false },
        { op: 'replace', index: 3, oldValue: true, newValue: false },
        { op: 'insert', index: 5, oldValue: void 0, newValue: false },
        { op: 'insert', index: 6, oldValue: void 0, newValue: false },
        { op: 'insert', index: 7, oldValue: void 0, newValue: false },
      ]);
    });

    it('should emit the changes when the index mapper length is changed (emulation of loading smaller dataset)', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const hidingMap2 = indexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');
      const hidingMap3 = indexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');

      indexMapper.initToLength(8);

      hidingMap1.setValueAtIndex(2, true);
      hidingMap2.setValueAtIndex(5, true);
      hidingMap3.setValueAtIndex(7, true);

      const observer = indexMapper.createChangesObserver('hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      observer.subscribe(observerListener);

      expect(observerListener).toHaveBeenCalledTimes(1);

      indexMapper.initToLength(5);

      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 2, oldValue: true, newValue: false },
        { op: 'remove', index: 5, oldValue: true, newValue: void 0 },
        { op: 'remove', index: 6, oldValue: false, newValue: void 0 },
        { op: 'remove', index: 7, oldValue: true, newValue: void 0 },
      ]);
    });

    it('should emit the changes when the index mapper length is decreased to 0 (emulation of loading an empty dataset)', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const hidingMap2 = indexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');
      const hidingMap3 = indexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');

      indexMapper.initToLength(5);

      hidingMap1.setValueAtIndex(2, true);
      hidingMap2.setValueAtIndex(3, true);
      hidingMap3.setValueAtIndex(0, true);

      const observer = indexMapper.createChangesObserver('hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      observer.subscribe(observerListener);

      expect(observerListener).toHaveBeenCalledTimes(1);

      indexMapper.initToLength(0);

      expect(observerListener).toHaveBeenCalledTimes(2);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 0, oldValue: true, newValue: false },
        { op: 'replace', index: 2, oldValue: true, newValue: false },
        { op: 'replace', index: 3, oldValue: true, newValue: false },
      ]);

      indexMapper.initToLength(5);

      expect(observerListener).toHaveBeenCalledTimes(2);
    });

    it('should not emit the changes when the indexes are moved', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const hidingMap2 = indexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');
      const hidingMap3 = indexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');

      indexMapper.initToLength(8);

      hidingMap1.setValueAtIndex(2, true);
      hidingMap2.setValueAtIndex(3, true);
      hidingMap3.setValueAtIndex(0, true);
      hidingMap3.setValueAtIndex(6, true);

      const observer = indexMapper.createChangesObserver('hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      observer.subscribe(observerListener);

      expect(observerListener).toHaveBeenCalledTimes(1);

      indexMapper.moveIndexes([2, 3], 0);

      expect(observerListener).toHaveBeenCalledTimes(1);

      indexMapper.moveIndexes([6, 7], 3);

      expect(observerListener).toHaveBeenCalledTimes(1);
    });

    it('should emit the changes when the indexes are inserted', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const hidingMap2 = indexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');
      const hidingMap3 = indexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');

      indexMapper.initToLength(8);

      hidingMap1.setValueAtIndex(2, true);
      hidingMap2.setValueAtIndex(3, true);
      hidingMap3.setValueAtIndex(0, true);
      hidingMap3.setValueAtIndex(6, true);

      const observer = indexMapper.createChangesObserver('hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      observer.subscribe(observerListener);

      expect(observerListener).toHaveBeenCalledTimes(1);

      indexMapper.insertIndexes(3, 4);

      expect(observerListener).toHaveBeenCalledTimes(2);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: true, newValue: false },
        { op: 'replace', index: 6, oldValue: true, newValue: false },
        { op: 'replace', index: 7, oldValue: false, newValue: true },
        { op: 'insert', index: 8, oldValue: void 0, newValue: false },
        { op: 'insert', index: 9, oldValue: void 0, newValue: false },
        { op: 'insert', index: 10, oldValue: void 0, newValue: true },
        { op: 'insert', index: 11, oldValue: void 0, newValue: false },
      ]);

      indexMapper.insertIndexes(0, 2);

      expect(observerListener).toHaveBeenCalledTimes(3);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 0, oldValue: true, newValue: false },
        { op: 'replace', index: 4, oldValue: false, newValue: true },
        { op: 'replace', index: 7, oldValue: true, newValue: false },
        { op: 'replace', index: 9, oldValue: false, newValue: true },
        { op: 'replace', index: 10, oldValue: true, newValue: false },
        { op: 'insert', index: 12, oldValue: void 0, newValue: true },
        { op: 'insert', index: 13, oldValue: void 0, newValue: false },
      ]);
    });

    it('should emit the changes when the indexes are removed', () => {
      const indexMapper = new IndexMapper();
      const hidingMap1 = indexMapper.createAndRegisterIndexMap('my-hiding-map1', 'hiding');
      const hidingMap2 = indexMapper.createAndRegisterIndexMap('my-hiding-map2', 'hiding');
      const hidingMap3 = indexMapper.createAndRegisterIndexMap('my-hiding-map3', 'hiding');

      indexMapper.initToLength(14);

      hidingMap1.setValueAtIndex(2, true);
      hidingMap2.setValueAtIndex(3, true);
      hidingMap2.setValueAtIndex(7, true);
      hidingMap3.setValueAtIndex(0, true);
      hidingMap3.setValueAtIndex(6, true);
      hidingMap3.setValueAtIndex(10, true);

      const observer = indexMapper.createChangesObserver('hiding');
      const observerListener = jasmine.createSpy('observer-listener');

      observer.subscribe(observerListener);

      expect(observerListener).toHaveBeenCalledTimes(1);

      indexMapper.removeIndexes([2, 3, 4, 5]);

      expect(observerListener).toHaveBeenCalledTimes(2);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 7, oldValue: true, newValue: false },
        { op: 'remove', index: 10, oldValue: true, newValue: void 0 },
        { op: 'remove', index: 11, oldValue: false, newValue: void 0 },
        { op: 'remove', index: 12, oldValue: false, newValue: void 0 },
        { op: 'remove', index: 13, oldValue: false, newValue: void 0 },
      ]);

      indexMapper.removeIndexes([1, 2, 3, 5]);

      expect(observerListener).toHaveBeenCalledTimes(3);
      expect(observerListener).toHaveBeenLastCalledWith([
        { op: 'replace', index: 3, oldValue: true, newValue: false },
        { op: 'remove', index: 6, oldValue: true, newValue: void 0 },
        { op: 'remove', index: 7, oldValue: false, newValue: void 0 },
        { op: 'remove', index: 8, oldValue: false, newValue: void 0 },
        { op: 'remove', index: 9, oldValue: false, newValue: void 0 },
      ]);
    });
  });
});
