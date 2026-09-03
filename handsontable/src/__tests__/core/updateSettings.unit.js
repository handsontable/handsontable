import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import { TrimmingMap } from 'handsontable/translations/maps/trimmingMap';
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

  describe('a `columns` array shortened together with `data` (GitHub issue #5543)', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    const buildData = () => [
      { number: 1, string: 'Alpha' },
      { number: 2, string: 'Bravo' },
    ];

    it('should apply the new column configuration before the data phase reads it', () => {
      const numberRenderer = jest.fn();
      const stringRenderer = jest.fn();
      const core = new Core(container, {
        data: buildData(),
        licenseKey: 'non-commercial-and-evaluation',
        columns: [
          { data: 'number', renderer: numberRenderer },
          { data: 'string', renderer: stringRenderer },
        ],
      });

      core.init();

      let rendererDuringDataPhase = null;

      // `afterChange` fires inside `replaceData()`, one statement before the render it performs, so
      // it samples the column meta at the exact moment that render resolves a renderer from it.
      core.addHook('afterChange', () => {
        rendererDuringDataPhase = core.getCellMeta(0, 0).renderer;
      });

      core.updateSettings({
        data: buildData(),
        columns: [{ data: 'string', renderer: stringRenderer }],
      });

      // Before the fix this was `numberRenderer` - the renderer of the column that used to sit at
      // index 0 - and it was handed the surviving column's string value.
      expect(rendererDuringDataPhase).toBe(stringRenderer);

      core.destroy();
    });

    it('should validate the source data against the new column configuration', () => {
      const rejectEverything = () => false;
      const core = new Core(container, {
        data: buildData(),
        licenseKey: 'non-commercial-and-evaluation',
        allowInvalid: false,
        columns: [
          { data: 'number', sourceDataValidator: rejectEverything },
          { data: 'string' },
        ],
      });

      core.init();

      core.updateSettings({
        data: buildData(),
        columns: [{ data: 'string' }],
      });

      // The removed column rejected every value with `allowInvalid: false`, and a rejected value is
      // blanked at the address it was read from. Resolved against the previous column meta, that
      // rule wiped the surviving column's source values - a corruption no render repairs.
      expect(core.getSourceData().map(row => row.string)).toEqual(['Alpha', 'Bravo']);

      core.destroy();
    });

    it('should leave the surviving column with its own configuration once the call settles', () => {
      const numberRenderer = jest.fn();
      const stringRenderer = jest.fn();
      const core = new Core(container, {
        data: buildData(),
        licenseKey: 'non-commercial-and-evaluation',
        columns: [
          { data: 'number', renderer: numberRenderer },
          { data: 'string', renderer: stringRenderer },
        ],
      });

      core.init();

      core.updateSettings({
        data: buildData(),
        columns: [{ data: 'string', renderer: stringRenderer }],
      });

      expect(core.countCols()).toBe(1);
      expect(core.getCellMeta(0, 0).renderer).toBe(stringRenderer);
      expect(core.getCellMeta(0, 0).data).toBe('string');

      core.destroy();
    });

    it('should keep cell meta set imperatively when the `columns` array shrinks', () => {
      const core = new Core(container, {
        data: buildData(),
        licenseKey: 'non-commercial-and-evaluation',
        columns: [
          { data: 'number' },
          { data: 'string' },
        ],
      });

      core.init();
      core.setCellMeta(0, 0, 'className', 'marked');

      core.updateSettings({
        data: buildData(),
        columns: [{ data: 'string' }],
      });

      // The early pass clears the meta caches, so it owes the same snapshot-and-replay the late pass
      // has always done (GitHub issue #4446).
      expect(core.getCellMeta(0, 0).className).toBe('marked');

      core.destroy();
    });

    it('should apply the `columns` array to every physical column when one is trimmed', () => {
      const rendererA = jest.fn();
      const rendererB = jest.fn();
      const rendererC = jest.fn();
      const buildColumns = () => [
        { data: 'a', renderer: rendererA },
        { data: 'b', renderer: rendererB },
        { data: 'c', renderer: rendererC },
      ];
      const core = new Core(container, {
        data: [{ a: 1, b: 2, c: 3 }],
        licenseKey: 'non-commercial-and-evaluation',
        columns: buildColumns(),
      });

      core.init();

      const trimmingMap = new TrimmingMap();

      core.columnIndexMapper.registerMap('updateSettingsTrim', trimmingMap);
      trimmingMap.setValueAtIndex(1, true);
      core.columnIndexMapper.updateCache(true);

      expect(core.countCols()).toBe(2);

      core.updateSettings({
        data: [{ a: 1, b: 2, c: 3 }],
        columns: buildColumns(),
      });

      const metaManager = core._getMetaManager();

      // The `columns` array addresses PHYSICAL columns, while the loop that re-applies it is bound by
      // `countCols()` - the not-trimmed count. With a column trimmed, that bound stopped one entry
      // short and left the last physical column on the default renderer.
      expect(metaManager.getColumnMeta(0).renderer).toBe(rendererA);
      expect(metaManager.getColumnMeta(1).renderer).toBe(rendererB);
      expect(metaManager.getColumnMeta(2).renderer).toBe(rendererC);

      core.columnIndexMapper.unregisterMap('updateSettingsTrim');
      core.destroy();
    });

    it('should keep the early and late column passes in agreement under `maxCols`', () => {
      const rendererA = jest.fn();
      const rendererB = jest.fn();
      const rendererC = jest.fn();
      const buildColumns = () => [
        { data: 'a', renderer: rendererA },
        { data: 'b', renderer: rendererB },
        { data: 'c', renderer: rendererC },
      ];
      const core = new Core(container, {
        data: [{ a: 1, b: 2, c: 3 }],
        licenseKey: 'non-commercial-and-evaluation',
        maxCols: 2,
        columns: buildColumns(),
      });

      core.init();

      core.updateSettings({
        data: [{ a: 1, b: 2, c: 3 }],
        columns: buildColumns(),
      });

      // `countCols()` caps at `maxCols`, so the late pass stops there too. The early pass carries the
      // same cap, which is what keeps the two bounds in agreement: without it the early pass would
      // write meta to a column the grid does not render and the late pass never revisits.
      expect(core.countCols()).toBe(2);
      expect(core.getCellMeta(0, 0).renderer).toBe(rendererA);
      expect(core.getCellMeta(0, 1).renderer).toBe(rendererB);

      core.destroy();
    });

    it('should re-read a `columns` function on an update that does not name it', () => {
      const firstRenderer = jest.fn();
      const secondRenderer = jest.fn();
      let currentRenderer = firstRenderer;
      const core = new Core(container, {
        data: [['a']],
        licenseKey: 'non-commercial-and-evaluation',
        columns: () => ({ renderer: currentRenderer }),
      });

      core.init();

      expect(core.getCellMeta(0, 0).renderer).toBe(firstRenderer);

      currentRenderer = secondRenderer;
      core.updateSettings({});

      // A `columns` function may read state the payload does not carry, so an update that names no
      // `columns` still has to re-read it. That is why the function form is left to the late pass
      // instead of being resolved early, where its column count is not yet known.
      expect(core.getCellMeta(0, 0).renderer).toBe(secondRenderer);

      core.destroy();
    });
  });
});
