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
      // `removedWarnOnce` records printed warnings module-globally, so without this each spec
      // below would depend on the order the specs run in.
      _resetDeprecationWarnings();

      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    it('should warn once, without a `Deprecated:` prefix, when a removed option is configured', () => {
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
      // A removed option is not deprecated - the message must not borrow the deprecation prefix.
      expect(calls[0][0]).not.toMatch(/^Deprecated:/);
      // `#12015` removed `PersistentState` in 17.0.0; the 18.0.0 changelog line describes a
      // develop-only re-removal after the TypeScript conversion and never reached a published package.
      expect(calls[0][0]).toMatch(/^The "persistentState" setting was removed in Handsontable 17\.0\.0/);

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
      expect(calls[0][0]).toMatch(/^The "correctFormat" setting was removed in Handsontable 18\.0\.0/);

      core.destroy();
      warnSpy.mockRestore();
    });

    it('should warn once when a removed option is configured in the declarative `cell` array', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const core = new Core(container, {
        data: [['a', 'b']],
        licenseKey: 'non-commercial-and-evaluation',
      });

      core.init();
      // The most cell-specific declarative form. Without the `cell` scan this caller would get a
      // clean console and silently dropped date auto-correction.
      core.updateSettings({
        cell: [
          { row: 0, col: 0, correctFormat: true },
          { row: 0, col: 1, correctFormat: true },
        ],
      });

      const calls = warnSpy.mock.calls.filter(([message]) => String(message).includes('"correctFormat"'));

      expect(calls.length).toBe(1);

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

    it('should point each option at the docs of the release that removed it', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const core = new Core(container, {
        data: [['a']],
        licenseKey: 'non-commercial-and-evaluation',
        persistentState: true,
        correctFormat: true,
      });

      core.init();

      const persistentStateCalls = warnSpy.mock.calls
        .filter(([message]) => String(message).includes('"persistentState"'));
      const correctFormatCalls = warnSpy.mock.calls
        .filter(([message]) => String(message).includes('"correctFormat"'));

      // The bare `/docs/<page>` form 404s; the docs site requires the framework segment.
      // `persistentState` went in 17.0, so the 17.1 -> 18.0 guide has nothing to say about it.
      expect(persistentStateCalls[0][0]).toContain('handsontable.com/docs/javascript-data-grid/changelog-17/');
      expect(correctFormatCalls[0][0])
        .toContain('handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0/');

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
