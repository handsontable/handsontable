import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
  type TranscriptIncomplete,
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
 * throw, a step whose `after` state never comes, a screen reader that does not start. A run that
 * throws, in a step or before the first one, still leaves the transcript, with the steps captured
 * before it and where it stopped (`incomplete`).
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
 * What `ready()` records in `entering` when the mode toggle named no mode: the run goes on, and the
 * transcript says the mode was never confirmed.
 */
const NO_MODE_ANNOUNCED = '(no mode announced after the toggle)';
/**
 * The `incomplete.step` of a run that stopped before its first step: the page load, the reader's
 * entry, the setup actions or the mode pin.
 */
const SETUP_STEP = 'setup';
/**
 * The words a screen reader speaks for a role, for the `dom-echo` reader: the raw ARIA role is one word
 * (`columnheader`), and a token group asks for the spoken words (`column header`). A role not listed
 * is echoed as it is.
 */
const SPOKEN_ROLES: Record<string, string> = {
  gridcell: 'cell',
  columnheader: 'column header',
  rowheader: 'row header',
  menuitem: 'menu item',
  menuitemcheckbox: 'menu item checkbox',
  menu: 'menu',
  treegrid: 'tree grid',
  textarea: 'edit',
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
      // browse mode (NVDA had switched already) is toggled back. The last mode phrase wins, inside one
      // phrase too (`focus mode. browse mode` is browse mode). When the last toggle names no mode, the
      // run goes on, and `entering` ends with `NO_MODE_ANNOUNCED`, so the transcript says the mode was
      // never confirmed.
      // The raw text, never the normalized one: the normalizer strips the mode phrases as chatter.
      const entering = [...(await screenReader.spokenPhraseLog())];
      const lastMode = (phrases: string[]) => phrases.reduce<string | null>((mode, phrase) => {
        const found = [...String(phrase).toLowerCase().matchAll(/\b(focus|browse) mode\b/g)];

        return found.length > 0 ? found[found.length - 1][0] : mode;
      }, null);
      const toggle = async() => {
        await screenReader.perform(NVDAKeyCodeCommands.toggleBetweenBrowseAndFocusMode, { capture: true });
        const toggled = await screenReader.lastSpokenPhrase();

        entering.push(toggled);

        return lastMode([toggled]);
      };

      if (lastMode(entering) !== 'focus mode') {
        let mode = await toggle();

        if (mode === 'browse mode') {
          mode = await toggle();
        }
        if (mode === null) {
          entering.push(NO_MODE_ANNOUNCED);
        }
      }
      await screenReader.clearSpokenPhraseLog();

      return entering;
    },
    async capture(action) {
      const { spokenPhrase } = await screenReader.capture(action, { capture: true });

      if (spokenPhrase !== '') {
        return spokenPhrase;
      }

      // Nothing within a second of silence: listen once more for another silence window. NVDA can
      // speak more than a second after the action completed (Shift+F10 on Firefox announced the menu
      // that late, and the phrase landed in the next step's capture), so a late phrase usually lands on
      // its own step. Guidepup discards speech that arrives while it stops the previous utterance, so
      // the second listen reduces late phrases in the next step, it does not remove them. Guidepup's
      // silence window is the wait.
      const late = await screenReader.capture(async() => {}, { capture: true });

      return late.spokenPhrase;
    },
  };
}

/**
 * The reader of the `dom-echo` lane: the focused element's accessible name, role (in the words a
 * screen reader speaks, `SPOKEN_ROLES`) and grid position, read from the DOM two frames after the
 * action (the focus settles a frame after some keys). It always announces the focused element, so a
 * step a screen reader stays silent on announces here: it proves the fixture, the keys, the `after`
 * states and the report, never the wording.
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

      return page.evaluate(roles => new Promise<string>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const element = document.activeElement;

          if (!element || element === document.body) {
            resolve('');

            return;
          }

          const live = [...document.querySelectorAll('[aria-live]')].map(region => region.textContent?.trim() ?? '').filter(Boolean);
          const name = element.getAttribute('aria-label') ?? (element as HTMLTextAreaElement).value ?? element.textContent?.trim() ?? '';
          const rawRole = element.getAttribute('role') ?? element.tagName.toLowerCase();
          const role = Object.hasOwn(roles, rawRole) ? roles[rawRole] : rawRole;
          const row = element.closest('tr')?.getAttribute('aria-rowindex');
          const col = element.getAttribute('aria-colindex');
          const described = element.getAttribute('aria-describedby')?.split(' ').map(id => document.getElementById(id)?.textContent?.trim()).filter(Boolean).join(' ');
          const states = ['aria-sort', 'aria-expanded', 'aria-selected'].map(attr => (element.hasAttribute(attr) ? `${attr.slice(5)} ${element.getAttribute(attr)}` : null)).filter(Boolean);

          resolve([name, role, described, row ? `row ${row}` : '', col ? `column ${col}` : '', ...states, ...live].filter(Boolean).join('. '));
        }));
      }), SPOKEN_ROLES);
    },
  };
}

/**
 * What one run of a scenario captured, for its transcript.
 */
interface ScenarioRun {
  startedAt: string;
  started: number;
  steps: TranscriptStep[];
  entering: string[];
  incomplete?: TranscriptIncomplete;
}

/**
 * The text of an error for a transcript: its message without the terminal colors a Playwright
 * assertion message carries.
 *
 * @param error The error.
 * @returns The text.
 */
function errorText(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  return message.replace(/\u001b\[[0-9;]*m/g, '').trim();
}

/**
 * The path of a scenario's transcript on this project, without the extension (`.json`, `.log`).
 *
 * @param testInfo The test's info.
 * @param scenario The scenario.
 * @returns The path.
 */
function transcriptBase(testInfo: TestInfo, scenario: Scenario): string {
  return path.join(TRANSCRIPTS_DIR, `${testInfo.project.name}--${scenario.id}`);
}

/**
 * Writes a scenario's transcript (`.json` and `.log`) and attaches both to the test. A complete run is
 * compared with the project's golden, or records it; a run that stopped at a step (`incomplete`) is
 * compared with nothing and records nothing, because half the steps would read as the whole wording.
 *
 * @param page The page.
 * @param reader The reader.
 * @param scenario The scenario.
 * @param testInfo The test's info.
 * @param run What the run captured.
 */
async function writeTranscript(page: Page, reader: Reader, scenario: Scenario, testInfo: TestInfo, run: ScenarioRun): Promise<void> {
  const project = testInfo.project.name;
  const goldenFile = path.join(GOLDENS_DIR, project, `${scenario.id}.json`);
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
    startedAt: run.startedAt,
    durationMs: Date.now() - run.started,
    steps: run.steps,
    golden: { status: 'incomplete', differences: [] },
    ...(run.incomplete ? { incomplete: run.incomplete } : {}),
  };

  if (!run.incomplete && updatesGoldens(testInfo)) {
    mkdirSync(path.dirname(goldenFile), { recursive: true });
    writeFileSync(goldenFile, `${JSON.stringify(goldenFromTranscript(transcript), null, 2)}\n`);
    transcript.golden = { status: 'recorded', differences: [] };
  } else if (!run.incomplete) {
    const golden: Golden | null = existsSync(goldenFile) ? JSON.parse(readFileSync(goldenFile, 'utf8')) : null;

    transcript.golden = compareWithGolden(golden, run.steps);
  }

  mkdirSync(TRANSCRIPTS_DIR, { recursive: true });

  const file = transcriptBase(testInfo, scenario);

  writeFileSync(`${file}.json`, `${JSON.stringify({ ...transcript, entering: run.entering }, null, 2)}\n`);
  writeFileSync(`${file}.log`, renderTranscriptLog(transcript));
  await testInfo.attach('transcript', { path: `${file}.json`, contentType: 'application/json' });
  await testInfo.attach('transcript-log', { path: `${file}.log`, contentType: 'text/plain' });
}

/**
 * Runs one scenario with a reader and writes its transcript, also when it throws: in a step, or before
 * the first one (`incomplete.step` is then `SETUP_STEP`).
 *
 * @param page The page.
 * @param reader The reader.
 * @param scenario The scenario.
 * @param testInfo The test's info.
 */
async function runScenario(page: Page, reader: Reader, scenario: Scenario, testInfo: TestInfo): Promise<void> {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const steps: TranscriptStep[] = [];
  let entering: string[] = [];
  let running = SETUP_STEP;
  let incomplete: TranscriptIncomplete | undefined;

  // A retry writes the same file names: the previous attempt's transcript goes first, so an attempt
  // that never writes its own (a test timeout ends it without the `finally`) leaves no transcript for
  // the report to misread, instead of the last attempt's.
  rmSync(`${transcriptBase(testInfo, scenario)}.json`, { force: true });
  rmSync(`${transcriptBase(testInfo, scenario)}.log`, { force: true });

  // The transcript is written whatever happens: a failure while the page loads, the reader enters or
  // the setup runs (`setup`), or in a step (an `after` state that never comes, a capture that fails),
  // leaves the steps captured so far and where it stopped, which is what a red nightly is read from.
  // The error is rethrown, so the test stays red.
  try {
    await page.goto(scenarioUrl(scenario));
    await awaitBundle(page);
    await awaitFixtureBuilt(page);
    await reader.enter();

    for (const action of scenario.setup ?? []) {
      await runAction(page, action);
    }

    entering = await reader.ready();

    for (const step of scenario.steps) {
      running = step.id;

      const stepStarted = Date.now();
      const spoken = await reader.capture(async() => {
        await runAction(page, step.action);
        await awaitAfter(page, step);
      });
      const normalized = normalizeAnnouncement(spoken);

      steps.push({ id: step.id, action: step.action, spoken, normalized, tokens: matchTokenGroups(normalized, step.expect), durationMs: Date.now() - stepStarted });
    }
  } catch (error) {
    incomplete = { step: running, error: errorText(error) };

    throw error;
  } finally {
    await writeTranscript(page, reader, scenario, testInfo, { startedAt, started, steps, entering, incomplete });
  }

  if (SCREENREADER_MODE === 'gate') {
    const failed = steps.filter(step => !step.tokens.passed).map(step => step.id);

    expect(failed, 'steps whose announcement misses a token group').toEqual([]);
  }
}

const scenarios = loadScenarios(SCENARIOS_DIR, { fixtures: FIXTURES });

// One scenario at a time on a screen reader lane comes from the config: `withGuidepup` pins one worker
// and no parallelism, because a screen reader is one per machine. The dom-echo lane drives no screen
// reader and keeps the base config's parallelism. No serial mode on top: it would skip every scenario
// after a red one, and re-run the scenarios that passed on a retry.
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
