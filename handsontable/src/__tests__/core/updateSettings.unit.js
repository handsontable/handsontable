import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import { _resetDeprecationWarnings } from 'handsontable/helpers/console';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

describe('Core#updateSettings', () => {
  describe('removed options', () => {
    let container;

    beforeEach(() => {
      // `deprecatedWarnOnce` records printed warnings module-globally, so without this each spec
      // below would depend on the order the specs run in.
      _resetDeprecationWarnings();

      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    it('should warn once when an option removed in 18.0 is configured', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const core = new Core(container, {
        data: [['a']],
        licenseKey: 'non-commercial-and-evaluation',
        persistentState: true,
      });

      core.init();
      core.updateSettings({ persistentState: false });

      const calls = warnSpy.mock.calls.filter(([message]) => String(message).includes('"persistentState"'));

      expect(calls.length).toBe(1);
      expect(calls[0][0]).toMatch(/^Deprecated: .*removed in Handsontable 18\.0\.0/);

      core.destroy();
      warnSpy.mockRestore();
    });

    it('should not warn when no removed option is configured', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const core = new Core(container, {
        data: [['a']],
        licenseKey: 'non-commercial-and-evaluation',
      });

      core.init();
      core.updateSettings({ colHeaders: true });

      const calls = warnSpy.mock.calls.filter(([message]) => String(message).includes('was removed in Handsontable'));

      expect(calls.length).toBe(0);

      core.destroy();
      warnSpy.mockRestore();
    });

    it('should warn once when a removed option is configured on a column', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const core = new Core(container, {
        data: [['a']],
        licenseKey: 'non-commercial-and-evaluation',
      });

      core.init();
      // `correctFormat` is a cell option, so this is its most common form.
      core.updateSettings({ columns: [{ correctFormat: true }] });

      const calls = warnSpy.mock.calls.filter(([message]) => String(message).includes('"correctFormat"'));

      expect(calls.length).toBe(1);
      expect(calls[0][0]).toMatch(/^Deprecated: .*removed in Handsontable 18\.0\.0/);

      core.destroy();
      warnSpy.mockRestore();
    });

    it('should warn only once when a removed option is set on several columns', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const core = new Core(container, {
        data: [['a', 'b']],
        licenseKey: 'non-commercial-and-evaluation',
      });

      core.init();
      core.updateSettings({ columns: [{ correctFormat: true }, { correctFormat: false }] });

      const calls = warnSpy.mock.calls.filter(([message]) => String(message).includes('"correctFormat"'));

      expect(calls.length).toBe(1);

      core.destroy();
      warnSpy.mockRestore();
    });

    it('should not warn when `columns` is a function', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const core = new Core(container, {
        data: [['a']],
        licenseKey: 'non-commercial-and-evaluation',
      });

      core.init();
      core.updateSettings({ columns: () => ({ type: 'text' }) });

      const calls = warnSpy.mock.calls.filter(([message]) => String(message).includes('was removed in Handsontable'));

      expect(calls.length).toBe(0);

      core.destroy();
      warnSpy.mockRestore();
    });

    it('should point at the migration guide with the framework path segment', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const core = new Core(container, {
        data: [['a']],
        licenseKey: 'non-commercial-and-evaluation',
        persistentState: true,
      });

      core.init();

      const calls = warnSpy.mock.calls.filter(([message]) => String(message).includes('"persistentState"'));

      // The bare `/docs/migration-from-...` form 404s; the docs site requires the framework segment.
      expect(calls[0][0]).toContain('handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0/');

      core.destroy();
      warnSpy.mockRestore();
    });

    it('should leave the `datePickerConfig` warning to the date editor', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const core = new Core(container, {
        data: [['a']],
        licenseKey: 'non-commercial-and-evaluation',
        datePickerConfig: { firstDay: 1 },
      });

      core.init();

      const calls = warnSpy.mock.calls.filter(([message]) => String(message).includes('"datePickerConfig"'));

      // `DateEditor#prepare` owns this warning (it also covers the column- and cell-level forms),
      // so `updateSettings` must not print a second one for the same option.
      expect(calls.length).toBe(0);

      core.destroy();
      warnSpy.mockRestore();
    });
  });
});
