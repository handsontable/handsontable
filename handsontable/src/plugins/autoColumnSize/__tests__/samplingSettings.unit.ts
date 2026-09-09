import Handsontable from 'handsontable/base';
import { registerPlugin, AutoColumnSize } from 'handsontable/plugins';

registerPlugin(AutoColumnSize);

/**
 * Builds a grid with AutoColumnSize on.
 *
 * @param {object} settings Settings merged over the defaults.
 * @returns {object} The Handsontable instance.
 */
function buildGrid(settings: Record<string, unknown> = {}) {
  return new Handsontable(document.createElement('div'), {
    data: [['a', 'b'], ['c', 'd']],
    autoColumnSize: true,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });
}

describe('AutoColumnSize sampling settings', () => {
  it('should apply `samplingRatio` given in the initial settings', () => {
    const hot = buildGrid({ autoColumnSize: { samplingRatio: 6 } });

    expect(hot.getPlugin('autoColumnSize').samplesGenerator.getSampleCount()).toBe(6);

    hot.destroy();
  });

  it('should apply `samplingRatio` arriving through `updateSettings`', () => {
    // `enablePlugin` returns early on an already-enabled plugin and was the only place reading
    // this setting. `updatePlugin` existed but only refreshed changed headers, so the new value
    // was stored and never reached the samples generator.
    const hot = buildGrid();
    const plugin = hot.getPlugin('autoColumnSize');

    hot.updateSettings({ autoColumnSize: { samplingRatio: 6 } });

    expect(plugin.getSetting('samplingRatio')).toBe(6);
    expect(plugin.samplesGenerator.getSampleCount()).toBe(6);

    hot.destroy();
  });

  it('should apply `allowSampleDuplicates` arriving through `updateSettings`', () => {
    const hot = buildGrid();
    const plugin = hot.getPlugin('autoColumnSize');

    expect(plugin.samplesGenerator.allowDuplicates).toBe(false);

    hot.updateSettings({ autoColumnSize: { allowSampleDuplicates: true } });

    expect(plugin.samplesGenerator.allowDuplicates).toBe(true);

    hot.destroy();
  });

  it('should apply `useHeaders` arriving through `updateSettings`', () => {
    const hot = buildGrid({ colHeaders: true });
    const plugin = hot.getPlugin('autoColumnSize');

    hot.updateSettings({ autoColumnSize: { useHeaders: false } });

    expect(plugin.ghostTable.getSetting('useHeaders')).toBe(false);

    hot.destroy();
  });

  it('should restore the default sample count when `samplingRatio` is set back to `null`', () => {
    const hot = buildGrid({ autoColumnSize: { samplingRatio: 6 } });
    const plugin = hot.getPlugin('autoColumnSize');

    hot.updateSettings({ autoColumnSize: { samplingRatio: null } });

    expect(plugin.samplesGenerator.getSampleCount()).toBe(3);

    hot.destroy();
  });

  it('should drop the measured widths when a sampling setting changes', () => {
    const hot = buildGrid();
    const plugin = hot.getPlugin('autoColumnSize');
    const clearCache = spyOn(plugin, 'clearCache').and.callThrough();

    hot.updateSettings({ autoColumnSize: { samplingRatio: 6 } });

    expect(clearCache).toHaveBeenCalled();

    hot.destroy();
  });

  it('should keep the measured widths when the settings are re-sent unchanged', () => {
    // `SETTING_KEYS` is `true` for this plugin, so `updatePlugin` runs on every `updateSettings`
    // call - and the React and Angular wrappers re-send unchanged settings on every update. An
    // unconditional cache clear would re-measure every column on each of them.
    const hot = buildGrid({ autoColumnSize: { samplingRatio: 6, allowSampleDuplicates: true } });
    const plugin = hot.getPlugin('autoColumnSize');
    const clearCache = spyOn(plugin, 'clearCache').and.callThrough();

    hot.updateSettings({ autoColumnSize: { samplingRatio: 6, allowSampleDuplicates: true } });

    expect(clearCache).not.toHaveBeenCalled();

    hot.destroy();
  });
});
