import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { release } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect, type Page, type TestInfo } from '@playwright/test';
import { screenReaderTest, type ScreenReaderPlaywright } from '@guidepup/playwright';
import { NVDAKeyCodeCommands } from '@guidepup/guidepup';
import { awaitBundle, awaitFixtureBuilt } from '../fixtures/bundle';
import { loadScenarios, scenarioUrl, type Scenario, type ScenarioAction, type ScenarioStep } from '../lib/screenreader-scenario.mjs';
import {
  SCREENREADER_MODE,
  TRANSCRIPT_SCHEMA,
  compareWithGolden,
  goldenFromTranscript,
  matchTokenGroups,
  normalizeAnnouncement,
  renderTranscriptLog,
  type Golden,
  type Transcript,
  type TranscriptStep,
} from '../lib/screenreader-transcript.mjs';

/**
 * The screen reader runner: one test per scenario of `scenarios/`, on every project of
 * `playwright.screenreader.config.ts`. A test opens the scenario's fixture, lets the screen reader
 * enter the page, runs the setup (the API selection that puts the focus in the grid), pins the mode a
 * grid user works in, then captures what the screen reader says for every step
 * (`screenReader.capture(() => page.keyboard.press(key))`), normalizes it, checks the step's token
 * groups, compares the whole run with the project's golden, and writes the transcript
 * (`test-results/screenreader/transcripts/<project>--<scenario>.json` and `.log`), which
 * `scripts/screenreader-report.mjs` turns into the job summary and the check run.
 *
 * Report-only while `SCREENREADER_MODE` is `report`: a missing token group or a golden difference is
 * recorded, never asserted. What fails a test is tooling: a fixture that does not load, a constructor
 * throw, a step whose `after` state never comes, a screen reader that does not start.
 *
 * Goldens: `--update-snapshots` (`npm run test:screenreader:update-goldens`) or `HOT_SR_UPDATE_GOLDENS=1`
 * writes `goldens/<project>/<scenario>.json` from the run. Nobody records an NVDA golden on a Mac: the
 * nightly's `update-goldens` input records them on the Windows runner and uploads them as an artifact.
 *
 * The screen reader is behind a small `Reader` interface. The Guidepup reader is NVDA now; VoiceOver,
 * which needs its own way into the grid (`interact()`), lands in the next pull request. The `dom-echo`
 * lane echoes the focused element instead, on any platform, so the runner and the scenarios can be
 * proven without a screen reader.
 */
interface Reader {
  /**
   * The screen reader and its version, for the transcript.
   */
  name: string;
  /**
   * Moves the screen reader into the page once it is built, before the setup runs.
   */
  enter(): Promise<void>;
  /**
   * Runs after the setup put the focus in the grid: pins the mode and clears what was spoken so far.
   * Returns what the screen reader said while entering, for the record.
   */
  ready(): Promise<string[]>;
  /**
   * Runs one action and returns what the screen reader spoke for it.
   */
  capture(action: () => Promise<void>): Promise<string>;
}

type HotWindow = Window & { hot?: { selectCell(row: number, col: number): boolean } };

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCENARIOS_DIR = path.join(TESTS_ROOT, 'screenreader/scenarios');
const GOLDENS_DIR = path.join(TESTS_ROOT, 'screenreader/goldens');
const TRANSCRIPTS_DIR = path.join(TESTS_ROOT, 'test-results/screenreader/transcripts');
const FIXTURES = readdirSync(path.join(TESTS_ROOT, 'fixtures/demo')).filter(name => name.endsWith('.html'));
const DOM_ECHO = process.env.HOT_SR_LANE === 'dom-echo';
/**
 * NVDA settings for a reproducible transcript. The focus highlighter draws nothing a screen reader
 * user hears and would sit in every screenshot; and a mode switch is spoken rather than played as a
 * sound, so the transcript shows when NVDA entered focus mode and `ready()` can read the mode back.
 */
const NVDA_SETTINGS = {
  vision: { NVDAHighlighter: { highlightFocus: false, highlightNavigator: false, highlightBrowseMode: false, enabled: false } },
  virtualBuffers: { passThroughAudioIndication: false },
};

/**
 * Whether this run records the goldens: Playwright's `--update-snapshots` or the environment flag.
 *
 * @param testInfo The test's info.
 * @returns Whether to record.
 */
function updatesGoldens(testInfo: TestInfo): boolean {
  return testInfo.config.updateSnapshots === 'all' || testInfo.config.updateSnapshots === 'changed'
    || process.env.HOT_SR_UPDATE_GOLDENS === '1';
}

/**
 * Runs one scenario action on the page.
 *
 * @param page The page.
 * @param action The action.
 */
async function runAction(page: Page, action: ScenarioAction): Promise<void> {
  if ('press' in action) {
    await page.keyboard.press(action.press);
  } else if ('type' in action) {
    await page.keyboard.type(action.type);
  } else {
    const selected = await page.evaluate(([row, col]) => (window as HotWindow).hot?.selectCell(row, col) ?? null, action.selectCell);

    expect(selected, `selectCell(${action.selectCell.join(', ')}) through the fixture's instance`).toBe(true);
  }
}

/**
 * Waits for the state a step declares after its action, so the announcement of that state is inside
 * the capture and a step whose state never comes fails as tooling, with the step named.
 *
 * @param page The page.
 * @param step The step.
 */
async function awaitAfter(page: Page, step: ScenarioStep): Promise<void> {
  if (!step.after) {
    return;
  }
  if ('visible' in step.after) {
    await expect(page.locator(step.after.visible).first(), `step ${step.id}: ${step.after.visible} visible`).toBeVisible();
  } else {
    await expect(page.locator(step.after.hidden).first(), `step ${step.id}: ${step.after.hidden} hidden`).toBeHidden();
  }
}

/**
 * The Guidepup reader for the screen reader the fixture started.
 *
 * @param screenReader Guidepup's screen reader.
 * @returns The reader.
 */
function guidepupReader(screenReader: ScreenReaderPlaywright): Reader {
  if (screenReader.name !== 'NVDA') {
    throw new Error(`The ${screenReader.name} runner is not in this lane yet: the VoiceOver lane lands in the next pull request.`);
  }

  return {
    name: `${screenReader.name} ${screenReader.version}`,
    async enter() {
      await screenReader.navigateToWebContent();
    },
    async ready() {
      // NVDA switches to focus mode on its own when the focus lands on a gridcell (its treatment of
      // ARIA grids), but Guidepup logs only what a command captured, so that switch is not in the log.
      // Pinning it keeps every transcript in the mode a grid user works in: the last mode the log holds
      // decides, a toggle corrects it when that was browse mode or none, and a toggle that lands in
      // browse mode (NVDA had switched already) is toggled back.
      // The raw text, never the normalized one: the normalizer strips the mode phrases as chatter.
      const entering = [...(await screenReader.spokenPhraseLog())];
      const lastMode = (phrases: string[]) => phrases.reduce<string | null>(
        (mode, phrase) => String(phrase).toLowerCase().match(/\b(focus|browse) mode\b/)?.[0] ?? mode, null);

      if (lastMode(entering) !== 'focus mode') {
        await screenReader.perform(NVDAKeyCodeCommands.toggleBetweenBrowseAndFocusMode, { capture: true });
        const toggled = await screenReader.lastSpokenPhrase();

        entering.push(toggled);

        if (lastMode([toggled]) === 'browse mode') {
          await screenReader.perform(NVDAKeyCodeCommands.toggleBetweenBrowseAndFocusMode, { capture: true });
          entering.push(await screenReader.lastSpokenPhrase());
        }
      }
      await screenReader.clearSpokenPhraseLog();

      return entering;
    },
    async capture(action) {
      const { spokenPhrase } = await screenReader.capture(action, { capture: true });

      return spokenPhrase;
    },
  };
}

/**
 * The reader of the `dom-echo` lane: the focused element's accessible name, role and grid position,
 * read from the DOM two frames after the action (the focus settles a frame after some keys).
 *
 * @param page The page.
 * @returns The reader.
 */
function domEchoReader(page: Page): Reader {
  return {
    name: 'dom-echo (the focused element, no screen reader)',
    async enter() {},
    async ready() {
      return [];
    },
    async capture(action) {
      await action();

      return page.evaluate(() => new Promise<string>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const element = document.activeElement;

          if (!element || element === document.body) {
            resolve('');

            return;
          }

          const live = [...document.querySelectorAll('[aria-live]')].map(region => region.textContent?.trim() ?? '').filter(Boolean);
          const name = element.getAttribute('aria-label') ?? (element as HTMLTextAreaElement).value ?? element.textContent?.trim() ?? '';
          const role = element.getAttribute('role') ?? element.tagName.toLowerCase();
          const row = element.closest('tr')?.getAttribute('aria-rowindex');
          const col = element.getAttribute('aria-colindex');
          const described = element.getAttribute('aria-describedby')?.split(' ').map(id => document.getElementById(id)?.textContent?.trim()).filter(Boolean).join(' ');
          const states = ['aria-sort', 'aria-expanded', 'aria-selected'].map(attr => (element.hasAttribute(attr) ? `${attr.slice(5)} ${element.getAttribute(attr)}` : null)).filter(Boolean);

          resolve([name, role, described, row ? `row ${row}` : '', col ? `column ${col}` : '', ...states, ...live].filter(Boolean).join('. '));
        }));
      }));
    },
  };
}

/**
 * Runs one scenario with a reader and writes its transcript.
 *
 * @param page The page.
 * @param reader The reader.
 * @param scenario The scenario.
 * @param testInfo The test's info.
 */
async function runScenario(page: Page, reader: Reader, scenario: Scenario, testInfo: TestInfo): Promise<void> {
  const project = testInfo.project.name;
  const startedAt = new Date().toISOString();
  const started = Date.now();

  await page.goto(scenarioUrl(scenario));
  await awaitBundle(page);
  await awaitFixtureBuilt(page);
  await reader.enter();

  for (const action of scenario.setup ?? []) {
    await runAction(page, action);
  }

  const entering = await reader.ready();
  const steps: TranscriptStep[] = [];

  for (const step of scenario.steps) {
    const stepStarted = Date.now();
    const spoken = await reader.capture(async() => {
      await runAction(page, step.action);
      await awaitAfter(page, step);
    });
    const normalized = normalizeAnnouncement(spoken);

    steps.push({ id: step.id, action: step.action, spoken, normalized, tokens: matchTokenGroups(normalized, step.expect), durationMs: Date.now() - stepStarted });
  }

  const goldenFile = path.join(GOLDENS_DIR, project, `${scenario.id}.json`);
  const golden: Golden | null = existsSync(goldenFile) ? JSON.parse(readFileSync(goldenFile, 'utf8')) : null;
  const transcript: Transcript = {
    schema: TRANSCRIPT_SCHEMA,
    scenario: scenario.id,
    surface: scenario.surface,
    project,
    mode: SCREENREADER_MODE,
    attempt: testInfo.retry,
    environment: {
      screenReader: reader.name,
      browser: `${testInfo.project.use.defaultBrowserType ?? 'chromium'} ${page.context().browser()?.version() ?? ''}`.trim(),
      platform: `${process.platform} ${release()}`,
    },
    startedAt,
    durationMs: Date.now() - started,
    steps,
    golden: compareWithGolden(golden, steps),
  };

  if (updatesGoldens(testInfo)) {
    mkdirSync(path.dirname(goldenFile), { recursive: true });
    writeFileSync(goldenFile, `${JSON.stringify(goldenFromTranscript(transcript), null, 2)}\n`);
    transcript.golden = { status: 'recorded', differences: [] };
  }

  mkdirSync(TRANSCRIPTS_DIR, { recursive: true });

  const file = path.join(TRANSCRIPTS_DIR, `${project}--${scenario.id}`);

  writeFileSync(`${file}.json`, `${JSON.stringify({ ...transcript, entering }, null, 2)}\n`);
  writeFileSync(`${file}.log`, renderTranscriptLog(transcript));
  await testInfo.attach('transcript', { path: `${file}.json`, contentType: 'application/json' });
  await testInfo.attach('transcript-log', { path: `${file}.log`, contentType: 'text/plain' });

  if (SCREENREADER_MODE === 'gate') {
    const failed = steps.filter(step => !step.tokens.passed).map(step => step.id);

    expect(failed, 'steps whose announcement misses a token group').toEqual([]);
  }
}

const scenarios = loadScenarios(SCENARIOS_DIR, { fixtures: FIXTURES });

// One scenario at a time: a screen reader is one per machine, and the dom-echo lane keeps the same
// order so its transcripts read like the others'.
base.describe.configure({ mode: 'serial' });
screenReaderTest.use({
  screenReaderStartOptions: { capture: true, settings: process.platform === 'win32' ? NVDA_SETTINGS : undefined },
});

// A scenario file that does not validate is a red test, not a skipped one: the tooling test refuses
// it on a pull request already, and this keeps a run that got past it honest.
for (const { fileName, scenario, problems } of scenarios) {
  if (problems.length > 0 || !scenario) {
    base(`${fileName} is a valid scenario`, () => {
      expect(problems, `${fileName}`).toEqual([]);
    });
    continue;
  }

  if (DOM_ECHO) {
    base(scenario.id, async({ page }, testInfo) => {
      await runScenario(page, domEchoReader(page), scenario, testInfo);
    });
  } else {
    screenReaderTest(scenario.id, async({ page, screenReader }, testInfo) => {
      await runScenario(page, guidepupReader(screenReader), scenario, testInfo);
    });
  }
}
