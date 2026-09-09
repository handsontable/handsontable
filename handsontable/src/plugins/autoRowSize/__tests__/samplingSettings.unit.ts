import Handsontable from 'handsontable/base';
import { registerPlugin, AutoRowSize } from 'handsontable/plugins';

registerPlugin(AutoRowSize);

/**
 * Builds a grid with AutoRowSize on.
 *
 * @param {object} settings Settings merged over the defaults.
 * @returns {object} The Handsontable instance.
 */
function buildGrid(settings: Record<string, unknown> = {}) {
  return new Handsontable(document.createElement('div'), {
    data: [['a'], ['b'], ['c']],
    autoRowSize: true,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });
}

describe('AutoRowSize sampling settings', () => {
  it('should apply `samplingRatio` given in the initial settings', () => {
    const hot = buildGrid({ autoRowSize: { samplingRatio: 6 } });

    expect(hot.getPlugin('autoRowSize').samplesGenerator.getSampleCount()).toBe(6);

    hot.destroy();
  });

  it('should apply `samplingRatio` arriving through `updateSettings`', () => {
    // `enablePlugin` returns early on an already-enabled plugin and was the only place reading
    // this setting, so the new value was stored but never reached the samples generator. A user
    // raising the ratio at runtime saw no change at all.
    const hot = buildGrid();
    const plugin = hot.getPlugin('autoRowSize');

    hot.updateSettings({ autoRowSize: { samplingRatio: 6 } });

    expect(plugin.getSetting('samplingRatio')).toBe(6);
    expect(plugin.samplesGenerator.getSampleCount()).toBe(6);

    hot.destroy();
  });

  it('should apply `allowSampleDuplicates` arriving through `updateSettings`', () => {
    const hot = buildGrid();
    const plugin = hot.getPlugin('autoRowSize');

    expect(plugin.samplesGenerator.allowDuplicates).toBe(false);

    hot.updateSettings({ autoRowSize: { allowSampleDuplicates: true } });

    expect(plugin.samplesGenerator.allowDuplicates).toBe(true);

    hot.destroy();
  });

  it('should restore the default sample count when `samplingRatio` is set back to `null`', () => {
    const hot = buildGrid({ autoRowSize: { samplingRatio: 6 } });
    const plugin = hot.getPlugin('autoRowSize');

    hot.updateSettings({ autoRowSize: { samplingRatio: null } });

    expect(plugin.samplesGenerator.getSampleCount()).toBe(3);

    hot.destroy();
  });

  it('should drop the measured heights when a sampling setting changes', () => {
    const hot = buildGrid();
    const plugin = hot.getPlugin('autoRowSize');
    const clearCache = spyOn(plugin, 'clearCache').and.callThrough();

    hot.updateSettings({ autoRowSize: { samplingRatio: 6 } });

    expect(clearCache).toHaveBeenCalled();

    hot.destroy();
  });

  it('should keep the measured heights when the settings are re-sent unchanged', () => {
    // `SETTING_KEYS` is `true` for this plugin, so `updatePlugin` runs on every `updateSettings`
    // call - and the React and Angular wrappers re-send unchanged settings on every update. An
    // unconditional cache clear would re-measure every row on each of them.
    const hot = buildGrid({ autoRowSize: { samplingRatio: 6, allowSampleDuplicates: true } });
    const plugin = hot.getPlugin('autoRowSize');
    const clearCache = spyOn(plugin, 'clearCache').and.callThrough();

    hot.updateSettings({ autoRowSize: { samplingRatio: 6, allowSampleDuplicates: true } });

    expect(clearCache).not.toHaveBeenCalled();

    hot.destroy();
  });
});
