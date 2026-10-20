import { test, expect } from '../fixtures/test';
import { AutoSizeSamplingSettingsPage } from '../fixtures/pages/AutoSizeSamplingSettingsPage';

/**
 * DEV-2850. The auto-size sampling options only ever took effect as INITIAL settings. Passing
 * `samplingRatio` or `allowSampleDuplicates` to `updateSettings()` was silently ignored: the value
 * was stored and readable, but it never reached the samples generator.
 *
 * Making it apply then exposed a second problem, which is what the last test here guards. Because
 * `SETTING_KEYS` is `true`, an update that never mentions the plugin still reaches `updatePlugin()`,
 * and `BasePlugin` has by then fed the plugin its own missing key as `undefined` - wiping the stored
 * settings. Reading them in that state returns the DEFAULTS, so the ratio just set was reset and
 * every measured height dropped. The Vue wrapper sends exactly that payload shape on nearly every
 * prop change, since it omits the keys whose values have not changed.
 *
 * Row 1 of the fixture holds four values of one length, so the default cap of three samples per
 * length leaves the last column unsampled - and that column is the only narrow one, so its text is
 * the only text that wraps. All of it is content-driven geometry, which reads as zero in jsdom, so
 * it can only be checked in a real browser.
 */
test.describe('Auto-size sampling settings through updateSettings()', () => {
  let grid: AutoSizeSamplingSettingsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutoSizeSamplingSettingsPage(page, theme, bundle);
    await grid.goto();
  });

  test('applies a samplingRatio raised at runtime', async() => {
    // The control: the option is at its default, so the sampler is capped at three per length.
    expect(await grid.sampleCount()).toBe(3);

    const before = await grid.measuredRowHeights();

    await grid.setSamplingRatio(6);

    // The setting reached the sampler - this alone used to be false.
    expect(await grid.sampleCount()).toBe(6);

    // And the heights were measured again with it. Row 1 is the one that changes: the column the
    // old cap dropped is the only one whose text wraps, so bringing it into the sample is what
    // makes the row's measured height cover the wrapped lines. Asserted as "grew", not as an exact
    // pixel count, because the line height differs across the three themes.
    const after = await grid.measuredRowHeights();

    expect(after[1]).toBeGreaterThan(before[1] as number);

    // The rows that hold only short values are unaffected - so the re-measure is doing real work
    // rather than inflating everything.
    expect(after[0]).toBe(before[0]);
    expect(after[2]).toBe(before[2]);
    expect(after[3]).toBe(before[3]);
  });

  test('lines the row headers up with their rows once the ratio covers every column', async() => {
    await grid.setSamplingRatio(6);

    // The user-visible half. With the wrapping column unsampled, its cell renders three lines tall
    // - a cell never renders shorter than its own text - while the row header, with nothing to push
    // it taller, keeps the one-line height the measurement reported. Once the column is sampled the
    // two tables agree.
    //
    // A small tolerance rather than exactly 0: borders and box-model rounding move a row by a
    // fraction of a pixel across themes. The defect is nothing like that size - it drops two whole
    // wrapped lines.
    expect(await grid.worstRowHeaderDrift()).toBeLessThanOrEqual(1);
  });

  test('keeps the raised samplingRatio when an unrelated setting changes', async() => {
    await grid.setSamplingRatio(6);

    const heightsBefore = await grid.measuredRowHeights();
    const renderedBefore = await grid.renderedRowHeights();

    // A payload with no `autoRowSize` key. Nothing about it should touch row heights.
    await grid.changeUnrelatedSetting();

    // Without the restore, this reset the ratio to the default and re-measured every row, so the
    // wrapping row silently shrank back and the row headers drifted again.
    expect(await grid.sampleCount()).toBe(6);
    expect(await grid.measuredRowHeights()).toEqual(heightsBefore);
    expect(await grid.renderedRowHeights()).toEqual(renderedBefore);
    expect(await grid.worstRowHeaderDrift()).toBeLessThanOrEqual(1);
  });
});
