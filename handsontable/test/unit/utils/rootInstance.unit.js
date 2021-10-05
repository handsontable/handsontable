import {
  holder,
  rootInstanceSymbol,
  registerAsRootInstance,
  hasValidParameter,
  isRootInstance,
} from 'handsontable/utils/rootInstance';

describe('rootInstance', () => {
  describe('.registerAsRootInstance', () => {
    it('should mark an object as a root instance', () => {
      const object = {};

      registerAsRootInstance(object);

      expect(holder.get(object)).toBe(true);
    });
  });

  describe('.hasValidParameter', () => {
    it('should return `true` when valid Symbol was passed', () => {
      expect(hasValidParameter(rootInstanceSymbol)).toBe(true);
    });

    it('should return `false` when Symbol with the same name was passed', () => {
      expect(hasValidParameter(Symbol('rootInstance'))).toBe(false);
    });

    it('should return `false` when different values provided than Symbol', () => {
      expect(hasValidParameter()).toBe(false);
      expect(hasValidParameter('')).toBe(false);
      expect(hasValidParameter(null)).toBe(false);
      expect(hasValidParameter('rootInstance')).toBe(false);
      expect(hasValidParameter(10)).toBe(false);
    });
  });

  describe('.isRootInstance', () => {
    it('should return `true` when an object was marked as a root instance', () => {
      const object = {};

      holder.set(object, true);

      expect(isRootInstance(object)).toBe(true);
    });

    it('should return \'false\' when an object was not marked as a root instance', () => {
      const object = {};

      expect(isRootInstance(object)).toBe(false);
    });
  });
});
