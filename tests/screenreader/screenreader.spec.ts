import { execFile, execFileSync } from 'node:child_process';
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
import {
  OUTPUT_STEP_BOUNDARY,
  READ_LAST_PHRASE,
  STEP_BOUNDARY,
  isStepBoundary,
  stripStepBoundary,
  voiceOverAppleScript,
} from '../lib/screenreader-voiceover.mjs';

/**
 * The screen reader runner: one test per scenario of `scenarios/`, on every project of
 * `playwright.screenreader.config.ts`. A test opens the scenario's fixture, lets the screen reader
 * enter the page, runs the setup (the API selection that puts the focus in the grid), lets the reader
 * settle where a grid user works (NVDA's focus mode, VoiceOver interacting with the grid), then captures
 * what the screen reader says for every step
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
 * writes `goldens/<project>/<scenario>.json` from the run. Nobody records a golden on a developer
 * machine: the nightly's `update-goldens` input records them on the Windows and macOS runners and
 * uploads them as an artifact.
 *
 * The screen reader is behind a small `Reader` interface, one reader per screen reader Guidepup drives:
 * NVDA (`nvdaReader()`) and VoiceOver (`voiceOverReader()`), which differ in how they enter the grid and
 * in how a silent step is told from a repeated one. The `dom-echo` lane echoes the focused element
 * instead, on any platform, so the runner and the scenarios can be proven without a screen reader.
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
   * Runs after the setup put the focus in the grid: settles the reader where a grid user works (NVDA's
   * focus mode, VoiceOver interacting with the grid) and clears what was spoken so far. Returns what the
   * screen reader said while entering, for the record.
   */
  ready(): Promise<string[]>;
  /**
   * Runs one action and returns what the screen reader spoke for it, an empty string for silence.
   */
  capture(action: () => Promise<void>): Promise<string>;
  /**
   * Leaves the grid the way a user does, after the last step of a complete run, when the reader has a
   * way out (VoiceOver stops interacting). The transcript is written by then.
   */
  leave?(): Promise<void>;
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
 * VoiceOver preferences for a reproducible transcript, merged into the bundle `@guidepup/setup install
 * voiceover` installed. Usage hints off: VoiceOver says "You are currently on a cell, inside of a
 * table…" a second after every move, which is about VoiceOver, not the grid, and doubled every step's
 * time (about 10 s against 4 s). The mouse pointer no longer follows VoiceOver's cursor: with it on,
 * an opened context menu puts VoiceOver's cursor on the menu, the pointer lands in the menu's middle,
 * and the hover selects the item under it ("Remove column"), so every later ArrowDown started from
 * there. A keyboard user's pointer stays where it was.
 */
const VOICEOVER_SETTINGS = {
  SCRShouldOutputVOInstructions: false,
  SCRConfigurationCursorTrackingMToVO: false,
};
/**
 * What `ready()` records in `entering` when the mode toggle named no mode: the run goes on, and the
 * transcript says the mode was never confirmed.
 */
const NO_MODE_ANNOUNCED = '(no mode announced after the toggle)';
/**
 * How many times the VoiceOver reader reads the last phrase after it spoke the step boundary, before
 * it speaks the boundary again, and how many times it speaks it before the run stops as tooling. Each
 * read is one `osascript` round trip (tens of milliseconds), which is the polling interval: no timer.
 */
const BOUNDARY_READS = 40;
const BOUNDARY_ATTEMPTS = 3;
/**
 * The budget of one `osascript` call to VoiceOver, before Node kills it.
 */
const OSASCRIPT_TIMEOUT_MS = 10_000;
/**
 * The `incomplete.step` of a run that stopped before its first step: the page load, the reader's
 * entry, the setup actions or the reader settling in the grid.
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
 * The Guidepup reader for the screen reader the fixture started: Guidepup picks the platform's screen
 * reader (NVDA on Windows, VoiceOver on macOS), and the reader follows its name.
 *
 * @param screenReader Guidepup's screen reader.
 * @returns The reader.
 */
function guidepupReader(screenReader: ScreenReaderPlaywright): Reader {
  if (screenReader.name === 'NVDA') {
    return nvdaReader(screenReader);
  }
  if (screenReader.name === 'VoiceOver') {
    return voiceOverReader(screenReader);
  }

  throw new Error(`No reader for ${screenReader.name}: the screen reader lanes are NVDA and VoiceOver.`);
}

/**
 * Runs AppleScript in VoiceOver's dictionary through `osascript`, the way Guidepup does (the script on
 * stdin), and returns what it printed.
 *
 * @param body The commands, inside `tell application "VoiceOver"`.
 * @returns The script's output, trimmed.
 */
function runVoiceOverScript(body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile('/usr/bin/osascript', [], { timeout: OSASCRIPT_TIMEOUT_MS }, (error, stdout) => {
      if (error) {
        reject(error);

        return;
      }

      resolve(String(stdout).trim());
    });

    child.stdin?.end(voiceOverAppleScript(body));
  });
}

/**
 * Makes VoiceOver speak the step boundary and waits until it is VoiceOver's last phrase, so the next
 * capture tells silence (the boundary alone) from a phrase the previous step left behind
 * (`lib/screenreader-voiceover.mjs`). A read that fails counts as not yet. Speech that arrives while
 * the boundary is being set (a late phrase of the previous step) is lost, as Guidepup loses speech
 * while it stops the previous utterance.
 */
async function markStepBoundary(): Promise<void> {
  for (let attempt = 0; attempt < BOUNDARY_ATTEMPTS; attempt += 1) {
    await runVoiceOverScript(OUTPUT_STEP_BOUNDARY);

    for (let read = 0; read < BOUNDARY_READS; read += 1) {
      const last = await runVoiceOverScript(READ_LAST_PHRASE).catch(() => '');

      if (isStepBoundary(last)) {
        return;
      }
    }
  }

  throw new Error(`VoiceOver never reported the step boundary ("${STEP_BOUNDARY}") as its last phrase after ${BOUNDARY_ATTEMPTS} attempts; without it a silent step reads as the previous step's phrase.`);
}

/**
 * The macOS version, for the transcript: Guidepup's VoiceOver version is the version of its
 * preferences bundle, and VoiceOver ships with the system.
 *
 * @returns The product version (`26.0.1`), or `unknown`.
 */
function macOSVersion(): string {
  try {
    return execFileSync('/usr/bin/sw_vers', ['-productVersion'], { encoding: 'utf8' }).trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * The VoiceOver reader.
 *
 * - **Into the page**: Guidepup's `navigateToWebContent()` activates the browser, picks "web content"
 *   in VoiceOver's item chooser and interacts with it (VO-Shift-Down), so VoiceOver works inside the
 *   page and not on the browser's toolbar.
 * - **Into the grid**: Guidepup leaves VoiceOver's cursor on the first item of the page, the grid, and
 *   `enter()` interacts with it (VO-Shift-Down), the way a VoiceOver user enters a table. The setup
 *   then puts the focus on a cell, and VoiceOver's cursor follows the keyboard focus onto it. The
 *   order matters: interacting once the focus is on a cell takes VoiceOver into the cell's text, and on
 *   Chromium it then announced no cell move at all (in the run that tried it, only the editor and an
 *   API reselection were announced, 2 of 20 steps).
 *   What VoiceOver says on the way in goes to `entering`.
 * - **Each step**: VoiceOver keeps its last phrase, so a step it says nothing on would read as the
 *   previous step's phrase. Every capture starts with the step boundary as the last phrase
 *   (`markStepBoundary()`), and `stripStepBoundary()` removes it from what the capture read: a
 *   silent step is an empty string, as it is on NVDA. Keys still go to the page through Playwright,
 *   so VoiceOver hears the page react and never the keystroke, on NVDA's terms.
 * - **Out of the grid**: `leave()` stops interacting (VO-Shift-Up) after the last step.
 *
 * @param screenReader Guidepup's screen reader, VoiceOver.
 * @returns The reader.
 */
function voiceOverReader(screenReader: ScreenReaderPlaywright): Reader {
  return {
    name: `${screenReader.name} (macOS ${macOSVersion()})`,
    async enter() {
      await screenReader.navigateToWebContent();
      await screenReader.interact({ capture: true });
    },
    async ready() {
      const entering = [...(await screenReader.spokenPhraseLog())];

      await markStepBoundary();
      await screenReader.clearSpokenPhraseLog();

      return entering;
    },
    async capture(action) {
      await markStepBoundary();

      const { spokenPhrase } = await screenReader.capture(action, { capture: true });
      const spoken = stripStepBoundary(spokenPhrase);

      if (spoken !== '') {
        return spoken;
      }

      // Only the boundary: listen once more for another silence window, as the NVDA reader does, so a
      // phrase VoiceOver speaks late lands on its own step rather than the next one. The boundary is
      // still the last phrase, so a step that stays silent is still an empty string.
      const late = await screenReader.capture(async() => {}, { capture: true });

      return stripStepBoundary(late.spokenPhrase);
    },
    async leave() {
      await screenReader.stopInteracting({ capture: false });
    },
  };
}

/**
 * The NVDA reader.
 *
 * @param screenReader Guidepup's screen reader, NVDA.
 * @returns The reader.
 */
function nvdaReader(screenReader: ScreenReaderPlaywright): Reader {
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

  // After the transcript, on a complete run only: a failure here is tooling (the test goes red), and
  // it changes nothing the transcript records. A run that threw leaves the screen reader to the
  // fixture, which stops it.
  await reader.leave?.();

  if (SCREENREADER_MODE === 'gate') {
    const failed = steps.filter(step => !step.tokens.passed).map(step => step.id);

    expect(failed, 'steps whose announcement misses a token group').toEqual([]);
  }
}

const scenarios = loadScenarios(SCENARIOS_DIR, { fixtures: FIXTURES });

// One scenario at a time on a screen reader lane comes from the config: `withGuidepup` pins one worker
// and no parallelism, because a screen reader is one per machine. The dom-echo lane drives no screen
// reader and keeps the base config's parallelism. No serial mode on top: it would skip every scenario
// after a red one, and re-run the scenarios that passed on a retry. Each screen reader starts with its
// settings above: Guidepup starts NVDA on Windows and VoiceOver on macOS.
screenReaderTest.use({
  screenReaderStartOptions: { capture: true, settings: process.platform === 'win32' ? NVDA_SETTINGS : VOICEOVER_SETTINGS },
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
