import Handsontable from 'handsontable/base';
import { registerPlugin, ManualColumnFreeze } from 'handsontable/plugins';

registerPlugin(ManualColumnFreeze);

/**
 * Builds a 14 by 14 grid.
 *
 * @param {object} [settings] Extra settings.
 * @returns {Handsontable} The instance.
 */
function buildGrid(settings = {}) {
  return new Handsontable(document.createElement('div'), {
    startRows: 14,
    startCols: 14,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });
}

describe('updateSettings after a frozen count was lowered by alter()', () => {
  it('should set `fixedRowsTop` after `remove_row`', () => {
    const hot = buildGrid({ fixedRowsTop: 8 });

    hot.alter('remove_row', 0);

    expect(hot.getSettings().fixedRowsTop).toBe(7);

    hot.updateSettings({ fixedRowsTop: 2 });

    expect(hot.getSettings().fixedRowsTop).toBe(2);

    hot.destroy();
  });

  it('should set `fixedRowsBottom` after `remove_row`', () => {
    const hot = buildGrid({ fixedRowsBottom: 8 });

    hot.alter('remove_row', hot.countRows() - 1);

    expect(hot.getSettings().fixedRowsBottom).toBe(7);

    hot.updateSettings({ fixedRowsBottom: 2 });

    expect(hot.getSettings().fixedRowsBottom).toBe(2);

    hot.destroy();
  });

  it('should set `fixedColumnsStart` after `remove_col`', () => {
    const hot = buildGrid({ fixedColumnsStart: 8 });

    hot.alter('remove_col', 0);

    expect(hot.getSettings().fixedColumnsStart).toBe(7);

    hot.updateSettings({ fixedColumnsStart: 2 });

    expect(hot.getSettings().fixedColumnsStart).toBe(2);

    hot.destroy();
  });

  it('should set `fixedColumnsEnd` after `remove_col`', () => {
    const hot = buildGrid({ fixedColumnsEnd: 8 });

    hot.alter('remove_col', hot.countCols() - 1);

    expect(hot.getSettings().fixedColumnsEnd).toBe(7);

    hot.updateSettings({ fixedColumnsEnd: 2 });

    expect(hot.getSettings().fixedColumnsEnd).toBe(2);

    hot.destroy();
  });

  it('should set the legacy `fixedColumnsLeft` after `remove_col`', () => {
    const hot = buildGrid({ fixedColumnsLeft: 8 });

    hot.alter('remove_col', 0);

    expect(hot.getSettings().fixedColumnsStart).toBe(7);

    hot.updateSettings({ fixedColumnsLeft: 2 });

    expect(hot.getSettings().fixedColumnsStart).toBe(2);
    expect(hot.getSettings().fixedColumnsLeft).toBe(2);

    hot.destroy();
  });

  it('should keep lowering the count from the value set by `updateSettings()`', () => {
    const hot = buildGrid({ fixedColumnsStart: 8, fixedRowsBottom: 8 });

    hot.alter('remove_col', 0);
    hot.alter('remove_row', hot.countRows() - 1);
    hot.updateSettings({ fixedColumnsStart: 4, fixedRowsBottom: 4 });
    hot.alter('remove_col', 0);
    hot.alter('remove_row', hot.countRows() - 1);

    expect(hot.getSettings().fixedColumnsStart).toBe(3);
    expect(hot.getSettings().fixedRowsBottom).toBe(3);

    hot.destroy();
  });

  it('should keep the lowered count when `updateSettings()` re-sends the unchanged value', () => {
    const hot = buildGrid({
      fixedRowsTop: 8,
      fixedRowsBottom: 8,
      fixedColumnsStart: 8,
      fixedColumnsEnd: 8,
      manualColumnFreeze: true,
    });

    hot.alter('remove_row', 0);
    hot.alter('remove_row', hot.countRows() - 1);
    hot.alter('remove_col', 0);
    hot.alter('remove_col', hot.countCols() - 1);

    // A framework wrapper re-sends every option on each commit.
    hot.updateSettings({
      fixedRowsTop: 8,
      fixedRowsBottom: 8,
      fixedColumnsStart: 8,
      fixedColumnsEnd: 8,
      manualColumnFreeze: true,
    });

    expect(hot.getSettings().fixedRowsTop).toBe(7);
    expect(hot.getSettings().fixedRowsBottom).toBe(7);
    expect(hot.getSettings().fixedColumnsStart).toBe(7);
    expect(hot.getSettings().fixedColumnsEnd).toBe(7);

    hot.destroy();
  });

  it('should keep a column frozen by ManualColumnFreeze when `updateSettings()` re-sends the unchanged value', () => {
    const hot = buildGrid({ manualColumnFreeze: true, fixedColumnsStart: 2 });

    hot.getPlugin('manualColumnFreeze').freezeColumn(5);

    expect(hot.getSettings().fixedColumnsStart).toBe(3);

    hot.updateSettings({ fixedColumnsStart: 2 });

    expect(hot.getSettings().fixedColumnsStart).toBe(3);

    hot.destroy();
  });

  it('should keep `themeName` untouched when `updateSettings()` re-sends the current theme', () => {
    const hot = buildGrid({ themeName: 'ht-theme-main' });
    const before = hot.getSettings().themeName;

    hot.updateSettings({ themeName: 'ht-theme-main' });

    expect(hot.getSettings().themeName).toBe(before);

    hot.destroy();
  });

  it('should set `fixedColumnsStart` after the ManualColumnFreeze plugin froze a column', () => {
    const hot = buildGrid({ manualColumnFreeze: true });

    hot.getPlugin('manualColumnFreeze').freezeColumn(3);

    expect(hot.getSettings().fixedColumnsStart).toBe(1);

    hot.updateSettings({ fixedColumnsStart: 5 });

    expect(hot.getSettings().fixedColumnsStart).toBe(5);

    hot.destroy();
  });
});
