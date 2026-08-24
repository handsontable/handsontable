import {
  getEngineSettingsOverrides,
  getEngineSettingsWithDefaultsAndOverrides,
  getEngineSettingsWithOverrides,
  haveEngineSettingsChanged,
} from '../settings';

/**
 * `maxRows` and `maxColumns` are per-instance display limits in Handsontable, but engine-wide in
 * HyperFormula, so passing them on made the smallest limit of any attached grid clamp every sheet the
 * engine holds and HyperFormula throw `SheetSizeLimitExceededError`. They now never reach the engine,
 * at creation or on update. See GH #10672.
 */
describe('Formulas engine settings', () => {
  const engineConfig = { hyperformula: () => {}, maxRows: 123, maxColumns: 45 };

  describe('getEngineSettingsOverrides', () => {
    it('should not carry `maxRows` or `maxColumns`', () => {
      const overrides = getEngineSettingsOverrides({ maxRows: 2, maxColumns: 3 });

      expect('maxRows' in overrides).toBe(false);
      expect('maxColumns' in overrides).toBe(false);
    });

    it('should still carry the plugin language', () => {
      const overrides = getEngineSettingsOverrides({
        formulas: { language: { langCode: 'plPL' } }
      });

      expect(overrides.language).toBe('plPL');
    });
  });

  describe('getEngineSettingsWithOverrides (used on every `updateSettings`)', () => {
    it('should not carry the grid\'s `maxRows` or `maxColumns`', () => {
      const settings = getEngineSettingsWithOverrides({ maxRows: 2, maxColumns: 3 });

      expect('maxRows' in settings).toBe(false);
      expect('maxColumns' in settings).toBe(false);
    });

    it('should not carry `maxRows` or `maxColumns` declared in the engine config either', () => {
      const settings = getEngineSettingsWithOverrides({ formulas: { engine: engineConfig } });

      expect('maxRows' in settings).toBe(false);
      expect('maxColumns' in settings).toBe(false);
    });

    it('should report no change for a grid whose `maxRows` differs from the engine\'s', () => {
      const settings = getEngineSettingsWithOverrides({ maxRows: 2 });

      expect(haveEngineSettingsChanged({ maxRows: 40000 }, settings)).toBe(false);
    });
  });

  describe('getEngineSettingsWithDefaultsAndOverrides (used when the plugin creates the engine)', () => {
    it('should not bound the created engine by the grid\'s `maxRows`', () => {
      expect(getEngineSettingsWithDefaultsAndOverrides({ maxRows: 2 }).maxRows).toBe(Infinity);
    });

    it('should leave the created engine unbounded, not capped at HyperFormula\'s 40000', () => {
      expect(getEngineSettingsWithDefaultsAndOverrides({}).maxRows).toBe(Infinity);
    });

    it('should not bound the created engine by the engine config either', () => {
      const settings = getEngineSettingsWithDefaultsAndOverrides({
        maxRows: 2,
        formulas: { engine: engineConfig }
      });

      expect(settings.maxRows).toBe(Infinity);
      // Left unset so HyperFormula falls back to its own default, exactly as before - `maxColumns` was
      // read from a Handsontable option that does not exist (the option is `maxCols`).
      expect('maxColumns' in settings).toBe(false);
    });

    it('should keep passing through non-size engine settings', () => {
      const settings = getEngineSettingsWithDefaultsAndOverrides({
        formulas: { engine: { hyperformula: () => {}, useStats: true } }
      });

      expect(settings.useStats).toBe(true);
    });
  });
});
