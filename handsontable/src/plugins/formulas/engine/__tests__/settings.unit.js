import {
  getEngineSettingsOverrides,
  getEngineSettingsWithDefaultsAndOverrides,
  getEngineSettingsWithOverrides,
  haveEngineSettingsChanged,
} from '../settings';

/**
 * `maxRows` and `maxColumns` are per-instance display limits in Handsontable, but engine-wide in
 * HyperFormula. Syncing them on `updateSettings` clamped every sheet the engine holds, so with a
 * shared engine the smallest limit of any attached grid made HyperFormula throw
 * `SheetSizeLimitExceededError`. See GH #10672.
 *
 * An engine the plugin creates itself is private to one grid, so it is still bounded at creation.
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

  describe('getEngineSettingsWithDefaultsAndOverrides (used only when the plugin creates the engine)', () => {
    it('should still bound the created engine by the grid\'s `maxRows`', () => {
      expect(getEngineSettingsWithDefaultsAndOverrides({ maxRows: 2 }).maxRows).toBe(2);
    });

    it('should leave the created engine unbounded when the grid sets no `maxRows`', () => {
      expect(getEngineSettingsWithDefaultsAndOverrides({ maxRows: Infinity }).maxRows).toBe(Infinity);
    });

    it('should let the grid\'s limits win over the engine config, as before', () => {
      const settings = getEngineSettingsWithDefaultsAndOverrides({
        maxRows: 2,
        formulas: { engine: engineConfig }
      });

      expect(settings.maxRows).toBe(2);
      // `maxColumns` is not a Handsontable option, so it resolves to `undefined` and HyperFormula
      // falls back to its own default. Preserved deliberately - see the note in `settings.ts`.
      expect(settings.maxColumns).toBeUndefined();
    });
  });
});
