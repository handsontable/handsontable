import { test as base, expect, type Page } from '@playwright/test';
import { screenReaderTest, type ScreenReaderPlaywright } from '@guidepup/playwright';
import { BUNDLE_POLLING_MS, awaitBundle } from '../fixtures/bundle';
import { PHRASE_SEPARATOR, stripStepBoundary } from '../lib/screenreader-voiceover.mjs';
import { VOICEOVER_SETTINGS, markStepBoundary } from './voiceover';

/**
 * The exact VoiceOver utterance of a nested-rows cell, as a strict assertion. The scenario runner
 * (`screenreader.spec.ts`, `scenarios/nested-rows.scenario.json`) is report-only and matches token groups
 * in any order; this spec fails until VoiceOver says the required sentence word for word, in order:
 *
 *   `Item Grape, Level 2, 4 of 6 column 1, row Grape 12`
 *
 * on `fixtures/demo/nested-rows-utterance.html`, after `selectCell(0, 0)` (Fruit) and four ArrowDown
 * presses, and the same shape for Banana after two.
 *
 * - **The comma before `column 1`**: VoiceOver puts a pause between the cell and its column header, and
 *   its caption panel writes it as a comma (`4 of 6, column 1`), but the phrase Guidepup reads has no
 *   comma there. So the required text has none: a comma in Guidepup's phrase at that place comes from the
 *   page (a level text that ends with a comma), and the caption then shows it doubled (`4 of 6,, column 1`).
 *
 * - **What is compared**: the phrases VoiceOver spoke for the last ArrowDown press, joined with `, `, then
 *   normalized by `normalizeUtterance()` (whitespace collapsed and trimmed, no space before punctuation,
 *   lower case). Order, words, punctuation and duplicates must match: a doubled comma (`,,`) is a failure.
 * - **Which phrases belong to a press**: the runner's VoiceOver capture. Before each press VoiceOver speaks
 *   the step boundary and the spec waits until that is its last phrase (`markStepBoundary()`); Guidepup's
 *   `capture()` then polls VoiceOver's last phrase from the press until it holds still, and joins every new
 *   phrase with `PHRASE_SEPARATOR` (`. `). The spec removes the boundary (`stripStepBoundary()`), splits the
 *   capture back into phrases on that separator, and joins them with `, `. A capture that is empty is
 *   listened to once more, as the runner does, so a phrase VoiceOver speaks late lands on its own press.
 *   Every earlier press is captured the same way, so its speech has settled before the next press.
 * - **Lanes**: the VoiceOver projects only (`vo-chromium`, `vo-webkit`), on macOS. The `dom-echo` lane and
 *   every other platform report the VoiceOver tests as skipped with the reason; the comparison test below
 *   runs everywhere. On the nightly the VoiceOver tests run in the `keyboard` group's job (the group of
 *   `nested-rows.scenario.json`) and in a run of every group.
 */

/**
 * The fixture of this spec, opened on the main theme and the plain UMD bundle.
 */
const FIXTURE = '/tests/fixtures/demo/nested-rows-utterance.html?theme=main&bundle=umd';
/**
 * The group of the nested-rows scenario, whose nightly job runs these tests.
 */
const SCENARIO_GROUP = 'keyboard';
/**
 * The separator the phrases of one press are joined with before the comparison.
 */
const PHRASE_JOINER = ', ';
/**
 * What VoiceOver must say for each cell, after how many ArrowDown presses from Fruit.
 */
const REQUIRED = [
  { cell: 'Banana', presses: 2, utterance: 'Item Banana, Level 2, 2 of 6 column 1, row Banana 6' },
  { cell: 'Grape', presses: 4, utterance: 'Item Grape, Level 2, 4 of 6 column 1, row Grape 12' },
] as const;

type HotWindow = Window & {
  hot?: {
    selectCell(row: number, col: number): boolean;
    getSelectedLast(): number[] | undefined;
    getDataAtCell(row: number, col: number): unknown;
  };
  htBuildError?: string;
};

/**
 * Why the VoiceOver tests do not run here, or `null` when they do: the lane, the platform and the
 * nightly's scenario group decide it before any test starts.
 *
 * @returns The reason, or `null`.
 */
function voiceOverSkipReason(): string | null {
  if (process.env.HOT_SR_LANE === 'dom-echo') {
    return 'The dom-echo lane starts no screen reader, and the assertion is on what VoiceOver says.';
  }
  if (process.platform !== 'darwin') {
    return `VoiceOver runs on macOS only, and this run is on ${process.platform}.`;
  }

  const group = process.env.HOT_SR_GROUP || undefined;

  if (group !== undefined && group !== SCENARIO_GROUP) {
    return `The ${SCENARIO_GROUP} group's job runs these tests, and this job runs the ${group} group.`;
  }

  return null;
}

/**
 * An utterance as the comparison reads it: whitespace runs collapsed to one space and trimmed, no
 * whitespace before a punctuation mark (`Banana , Level` reads `Banana, Level`), and lower case. VoiceOver
 * joins a cell's text and its `::after` text with its own space (`Grape , Level 2`), while Chromium's
 * computed name has none (`Grape, Level 2`), and the speech does not change. Nothing else changes: the
 * order, the words and the duplicates stay, and a doubled comma (`,,`) still fails.
 *
 * @param utterance The spoken or the required text.
 * @returns The normalized text.
 */
function normalizeUtterance(utterance: string): string {
  return utterance
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/ ([,.;:!?])/g, '$1')
    .toLowerCase();
}

/**
 * The phrases of one capture without the step boundary, in the order VoiceOver spoke them.
 *
 * @param spoken Guidepup's capture: the phrases joined with `PHRASE_SEPARATOR`.
 * @returns The phrases.
 */
function phrasesOf(spoken: string): string[] {
  return stripStepBoundary(spoken).split(PHRASE_SEPARATOR).map(phrase => phrase.trim()).filter(Boolean);
}

/**
 * Runs one page action inside a VoiceOver capture that starts at the step boundary, and returns the
 * phrases VoiceOver spoke for it. An empty capture is listened to once more for a late phrase.
 *
 * @param screenReader Guidepup's VoiceOver.
 * @param action The page action.
 * @returns The phrases of the action.
 */
async function capturePress(screenReader: ScreenReaderPlaywright, action: () => Promise<void>): Promise<string[]> {
  await markStepBoundary();

  const { spokenPhrase } = await screenReader.capture(action, { capture: true });
  const phrases = phrasesOf(spokenPhrase);

  if (phrases.length > 0) {
    return phrases;
  }

  const late = await screenReader.capture(async() => {}, { capture: true });

  return phrasesOf(late.spokenPhrase);
}

/**
 * Opens the fixture, waits for the bundle and the grid, and rethrows the constructor error the fixture
 * kept, so a bad setting is a red test with its cause.
 *
 * @param page The page.
 */
async function openFixture(page: Page): Promise<void> {
  await page.goto(FIXTURE);
  await awaitBundle(page);
  await page.waitForFunction(() => 'hot' in window || 'htBuildError' in window, undefined, { polling: BUNDLE_POLLING_MS });

  const buildError = await page.evaluate(() => (window as HotWindow).htBuildError ?? null);

  if (buildError !== null) {
    throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
  }
}

base('the utterance comparison is strict about order, words and duplicates', () => {
  const required = normalizeUtterance(REQUIRED[0].utterance);

  expect(normalizeUtterance('  item banana,  Level 2,  2 of 6 column 1, row Banana 6 ')).toBe(required);
  expect(normalizeUtterance('Item Banana , Level 2, 2 of 6 column 1, row Banana 6')).toBe(required);
  expect(normalizeUtterance('Item Banana, Level 2, 2 of 6, column 1, row Banana 6')).not.toBe(required);
  expect(normalizeUtterance('Item Banana, Level 2, 2 of 6,, column 1, row Banana 6')).not.toBe(required);
  expect(normalizeUtterance('Banana , Level 2, 2 of 6 Item Banana, column 1, row Banana 6')).not.toBe(required);
  expect(normalizeUtterance('Level 2, 2 of 6, Item Banana, column 1, row Banana 6')).not.toBe(required);
  expect(normalizeUtterance('Item Banana, Level 2, 2 of 6, column 1, row Banana 6, Level 2')).not.toBe(required);
  expect(normalizeUtterance('Item Banana, Level 2, 2 of 6, column 1, row 3')).not.toBe(required);
  expect(phrasesOf('Step boundary. Item Banana. Level 2, 2 of 6 column 1, row Banana 6').join(PHRASE_JOINER)).toBe(REQUIRED[0].utterance);
});

const skipReason = voiceOverSkipReason();

screenReaderTest.use({
  screenReaderStartOptions: { capture: true, settings: VOICEOVER_SETTINGS },
});

screenReaderTest.describe('VoiceOver reads a nested-rows cell as one exact sentence', {
  annotation: skipReason === null ? [] : [{ type: 'skip', description: skipReason }],
}, () => {
  for (const { cell, presses, utterance } of REQUIRED) {
    screenReaderTest(`${cell}, after ${presses} ArrowDown presses from Fruit`, async({ page, screenReader }, testInfo) => {
      await openFixture(page);
      await screenReader.navigateToWebContent();
      await screenReader.interact({ capture: true });

      const onFruit = await capturePress(screenReader, async() => {
        const selected = await page.evaluate(() => (window as HotWindow).hot?.selectCell(0, 0) ?? null);

        expect(selected, 'selectCell(0, 0) on Fruit').toBe(true);
      });
      const perPress: string[][] = [];

      for (let press = 0; press < presses; press += 1) {
        perPress.push(await capturePress(screenReader, () => page.keyboard.press('ArrowDown')));
      }

      const selected = await page.evaluate(() => {
        const hot = (window as HotWindow).hot;
        const [row, col] = hot?.getSelectedLast() ?? [];

        return hot && row !== undefined && col !== undefined ? hot.getDataAtCell(row, col) : null;
      });
      const last = perPress.at(-1) ?? [];
      const spoken = last.join(PHRASE_JOINER);

      await testInfo.attach('voiceover-phrases', {
        body: JSON.stringify({ onFruit, perPress, spoken, required: utterance }, null, 2),
        contentType: 'application/json',
      });

      expect(selected, `the selection is on ${cell} after ${presses} ArrowDown presses`).toBe(cell);
      expect(normalizeUtterance(spoken), `VoiceOver's phrases per press: ${JSON.stringify({ onFruit, perPress })}`)
        .toBe(normalizeUtterance(utterance));
    });
  }
});
