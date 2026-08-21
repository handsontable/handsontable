import {
  DEFAULT_SETTINGS,
  getEngineSettingsOverrides,
  getEngineSettingsWithDefaultsAndOverrides,
  getEngineSettingsWithOverrides,
} from '../settings';

/**
 * `maxRows` and `maxColumns` are per-instance display limits in Handsontable, but engine-wide in
 * HyperFormula. Forwarding them meant that with a shared engine the smallest limit of any attached
 * grid clamped every sheet, and HyperFormula threw `SheetSizeLimitExceededError` on the next
 * `updateConfig`. See GH #10672.
 */
describe('Formulas engine settings', () => {
  describe('getEngineSettingsOverrides', () => {
    it('should not forward `maxRows` to the engine', () => {
      const overrides = getEngineSettingsOverrides({ maxRows: 2 });

      expect(overrides.maxRows).toBeUndefined();
      expect('maxRows' in overrides).toBe(false);
    });

    it('should not forward `maxColumns` to the engine', () => {
      const overrides = getEngineSettingsOverrides({ maxColumns: 2 });

      expect(overrides.maxColumns).toBeUndefined();
      expect('maxColumns' in overrides).toBe(false);
    });

    it('should still forward the plugin language', () => {
      const overrides = getEngineSettingsOverrides({
        formulas: { language: { langCode: 'plPL' } }
      });

      expect(overrides.language).toBe('plPL');
    });
  });

  describe('getEngineSettingsWithDefaultsAndOverrides', () => {
    it('should leave an engine created by Handsontable unbounded by rows', () => {
      expect(DEFAULT_SETTINGS.maxRows).toBe(Infinity);
      expect(getEngineSettingsWithDefaultsAndOverrides({}).maxRows).toBe(Infinity);
    });

    it('should not let the grid\'s `maxRows` clamp the engine', () => {
      const settings = getEngineSettingsWithDefaultsAndOverrides({ maxRows: 2, maxColumns: 3 });

      expect(settings.maxRows).toBe(Infinity);
      expect(settings.maxColumns).toBeUndefined();
    });

    it('should keep `maxRows` and `maxColumns` declared in the engine config', () => {
      const settings = getEngineSettingsWithDefaultsAndOverrides({
        maxRows: 2,
        maxColumns: 3,
        formulas: {
          engine: { hyperformula: () => {}, maxRows: 123, maxColumns: 45 }
        }
      });

      expect(settings.maxRows).toBe(123);
      expect(settings.maxColumns).toBe(45);
    });
  });

  describe('getEngineSettingsWithOverrides', () => {
    it('should not produce a `maxRows` change on every `updateSettings`', () => {
      const settings = getEngineSettingsWithOverrides({ maxRows: 2, maxColumns: 3 });

      expect(settings.maxRows).toBeUndefined();
      expect(settings.maxColumns).toBeUndefined();
    });
  });
});
