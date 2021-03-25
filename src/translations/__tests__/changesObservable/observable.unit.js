import { ChangesObservable } from 'handsontable/translations/changesObservable/observable';
import { ChangesObserver } from 'handsontable/translations/changesObservable/observer';

describe('ChangesObservable', () => {
  describe('createObserver', () => {
    it('should throw an error when passed indexMapType is not supported', () => {
      const observable = new ChangesObservable();

      expect(() => {
        observable.createObserver('fake-map-type');
      }).toThrowError('Unsupported index map type "fake-map-type".');
      expect(() => {
        observable.createObserver('trimming');
      }).toThrowError('Unsupported index map type "trimming".');
      expect(() => {
        observable.createObserver('linkedPhysicalIndexToValue');
      }).toThrowError('Unsupported index map type "linkedPhysicalIndexToValue".');
      expect(() => {
        observable.createObserver('physicalIndexToValue');
      }).toThrowError('Unsupported index map type "physicalIndexToValue".');
      expect(() => {
        observable.createObserver('index');
      }).toThrowError('Unsupported index map type "index".');
    });

    it('should not throw an error when passed indexMapType is supported', () => {
      const observable = new ChangesObservable();

      expect(() => {
        observable.createObserver('hiding');
      }).not.toThrowError();
    });

    it('should create observer, increase internal observer counter and return its instance', () => {
      const observable = new ChangesObservable();
      const observer1 = observable.createObserver('hiding');

      expect(observer1).toBeInstanceOf(ChangesObserver);
      expect(observable.globalObserversCount).toBe(1);

      const observer2 = observable.createObserver('hiding');

      expect(observer2).toBeInstanceOf(ChangesObserver);
      expect(observable.globalObserversCount).toBe(2);
    });

    it('should decrease internal observer counter after the observer is unsubscribed', () => {
      const observable = new ChangesObservable();
      const observer1 = observable.createObserver('hiding');
      const observer2 = observable.createObserver('hiding');
      const observer3 = observable.createObserver('hiding');

      expect(observable.globalObserversCount).toBe(3);

      observer2.unsubscribe();

      expect(observable.globalObserversCount).toBe(2);

      observer3.unsubscribe();

      expect(observable.globalObserversCount).toBe(1);

      observer1.unsubscribe();

      expect(observable.globalObserversCount).toBe(0);
    });
  });

  describe('collect', () => {
    it('should throw an error when passed indexMapType is not supported', () => {
      const observable = new ChangesObservable();

      expect(() => {
        observable.collect('fake-map-type');
      }).toThrowError('Unsupported index map type "fake-map-type".');
      expect(() => {
        observable.collect('trimming');
      }).toThrowError('Unsupported index map type "trimming".');
      expect(() => {
        observable.collect('linkedPhysicalIndexToValue');
      }).toThrowError('Unsupported index map type "linkedPhysicalIndexToValue".');
      expect(() => {
        observable.collect('physicalIndexToValue');
      }).toThrowError('Unsupported index map type "physicalIndexToValue".');
      expect(() => {
        observable.collect('index');
      }).toThrowError('Unsupported index map type "index".');
    });

    it('should not throw an error when passed indexMapType is supported', () => {
      const observable = new ChangesObservable();

      expect(() => {
        observable.collect('hiding', 'my-hiding-map', {
          changeType: 'single',
          oldValue: false,
          newValue: true,
        });
      }).not.toThrowError();
    });
  });
});
