import { REQUIRED_CONFIG_KEYS, SETTINGS_VALIDATORS } from '../constants';

describe('dataProvider constants', () => {
  describe('SETTINGS_VALIDATORS.refetchAfterCreate', () => {
    it('should accept both booleans', () => {
      expect(SETTINGS_VALIDATORS.refetchAfterCreate(true)).toBe(true);
      expect(SETTINGS_VALIDATORS.refetchAfterCreate(false)).toBe(true);
    });

    it('should accept an explicit `undefined` because the base plugin validates every key that is `in` the object', () => {
      expect(SETTINGS_VALIDATORS.refetchAfterCreate(undefined)).toBe(true);
    });

    it('should reject every other type', () => {
      expect(SETTINGS_VALIDATORS.refetchAfterCreate(null)).toBe(false);
      expect(SETTINGS_VALIDATORS.refetchAfterCreate('no')).toBe(false);
      expect(SETTINGS_VALIDATORS.refetchAfterCreate(0)).toBe(false);
      expect(SETTINGS_VALIDATORS.refetchAfterCreate(() => false)).toBe(false);
    });
  });

  describe('REQUIRED_CONFIG_KEYS', () => {
    it('should name only keys that have a validator', () => {
      REQUIRED_CONFIG_KEYS.forEach((key) => {
        expect(typeof SETTINGS_VALIDATORS[key]).toBe('function');
      });
    });

    it('should leave `refetchAfterCreate` optional', () => {
      expect(REQUIRED_CONFIG_KEYS).not.toContain('refetchAfterCreate');
      expect(REQUIRED_CONFIG_KEYS).toEqual(['rowId', 'fetchRows', 'onRowsCreate', 'onRowsUpdate', 'onRowsRemove']);
    });
  });
});
