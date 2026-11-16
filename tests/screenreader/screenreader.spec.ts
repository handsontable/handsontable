import { execFile, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { release } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect, type Page, type TestInfo } from '@playwright/test';
import { screenReaderTest, type ScreenReaderPlaywright } from '@guidepup/playwright';
import { NVDAKeyCodeCommands } from '@guidepup/guidepup';
import { BUNDLE_POLLING_MS, awaitBundle } from '../fixtures/bundle';
import {
  SCENARIO_GROUPS,
  laneOfProject,
  loadScenarios,
  scenarioPageId,
  scenarioBudgetMs,
  scenarioPlace,
  scenarioUrl,
  unsupportedReason,
  type ReadDirection,
  type Scenario,
  type ScenarioAction,
  type ScenarioStep,
  type SetupAction,
} from '../lib/screenreader-scenario.mjs';
import {
  SCREENREADER_MODE,
  TRANSCRIPT_SCHEMA,
  compareWithGolden,
  goldenFromTranscript,
  matchTokenGroups,
  matchTraversal,
  normalizeAnnouncement,
  renderTranscriptLog,
  type Golden,
  type Transcript,
  type TranscriptIncomplete,
  type TranscriptStep,
  type TranscriptUnsupportedStep,
} from '../lib/screenreader-transcript.mjs';
import { ensureNvdaMode, lastNvdaMode } from '../lib/screenreader-nvda.mjs';
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
 * `playwright.screenreader.config.ts`. A test opens the scenario's page (a catalog page of
 * `a11y/pages.mjs`, or a fixture), lets the screen reader enter the page (into the grid, or at the top of
 * the page: the scenario's `start`), runs the setup (settings, sentinels around the grid, the API
 * selection or focus that puts the user where the scenario starts), then captures what the screen reader
 * says for every step, normalizes it, checks the step's token groups, judges the reading traversal when
 * the scenario has one, compares the whole run with the project's golden, and writes the transcript
 * (`test-results/screenreader/transcripts/<project>--<scenario>.json` and `.log`), which
 * `scripts/screenreader-report.mjs` turns into the job summary, the evidence document and the check run.
 *
 * A step is one primitive. The page drives `press`, `type` and `selectCell` the same way on every lane
 * (`page.keyboard.press()`, so the screen reader sees the page react and never the keystroke); the reader
 * drives its own commands, `read` (`next`, `previous`, `in`, `out`) and `activate`, its way. A step the
 * lane cannot drive declares `unsupported` for it, and the runner skips it there and records it in the
 * transcript's `unsupported` list: a gap the report shows, never a silent skip.
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
   * Moves the screen reader into the page once it is built, before the setup runs: into the page's first
   * item, the grid (`grid`), or to the top of the page and nothing further (`page`).
   */
  enter(start: 'grid' | 'page'): Promise<void>;
  /**
   * Runs after the setup: clears what was spoken so far and returns it, for the record.
   */
  ready(): Promise<string[]>;
  /**
   * Runs one page action (a key, typed text, an API selection) where a grid user works (NVDA's focus
   * mode) and returns what the screen reader spoke for it, an empty string for silence.
   */
  capture(action: () => Promise<void>): Promise<Captured>;
  /**
   * Moves the reader's own cursor (`read`): to the next or previous item, into the item or out of it.
   */
  read(direction: ReadDirection): Promise<Captured>;
  /**
   * Performs the reader's activate gesture on the item under its cursor.
   */
  activate(): Promise<Captured>;
  /**
   * Leaves the grid the way a user does, after the last step of a complete run, when the reader has a
   * way out (VoiceOver stops interacting). The transcript is written by then, and a failure here is a
   * warning, never a red test.
   */
  leave?(): Promise<void>;
}

/**
 * What a reader captured for one step: the spoken text, and what it said while it prepared the primitive
 * (NVDA's switch between focus and browse mode), which is not the step's announcement.
 */
interface Captured {
  spoken: string;
  preparing: string[];
}

type HotInstance = {
  selectCell(row: number, col: number): boolean;
  updateSettings(settings: Record<string, unknown>): void;
  loadData(data: unknown[][]): void;
};
type HotWindow = Window & {
  hot?: HotInstance;
  htBuildError?: string;
  Handsontable?: { helper: { createSpreadsheetData(rows: number, columns: number): unknown[][] } };
};
type RootWrapper = HTMLElement & { __hotInstance?: HotInstance };

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCENARIOS_DIR = path.join(TESTS_ROOT, 'screenreader/scenarios');
const GOLDENS_DIR = path.join(TESTS_ROOT, 'screenreader/goldens');
/**
 * Where a recording run also writes the goldens it recorded, and nothing else: a job runs one scenario
 * group, so the goldens it uploads are that group's alone, and every group's artifact extracts into one
 * tree without one group's checkout copies replacing another's new recordings.
 */
const RECORDED_GOLDENS_DIR = path.join(TESTS_ROOT, 'test-results/screenreader/goldens');
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
 * The stylesheet the NVDA reader holds on the page while Guidepup enters it. Guidepup's
 * `navigateToWebContent()` clicks the middle of `<body>` and then presses a real Tab. When that point is
 * a cell, the click selects it, and from a cell of the last column the Tab leaves the grid; with nothing
 * focusable after the grid it leaves the page for the browser's toolbar. NVDA then has no document: its
 * mode switches name no mode, and the page actions, which Playwright sends to the page whatever has the
 * system focus, are never spoken. The date editor's fixture is six columns wide, so the middle of its
 * body is a cell of its last column, and NVDA heard nothing on that page in almost every run, on both
 * browsers. With the cells transparent to the pointer the click lands on what is under them, the table
 * or the grid's holder, as it does on the pages whose middle is no cell, and selects nothing.
 */
const ENTRY_POINTER_GUARD = 'td, th, td *, th * { pointer-events: none !important; }';
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
 * The test timeout of a scenario: its budget on a slow runner (`scenarioBudgetMs()` of
 * `lib/screenreader-scenario.mjs`), never below the config's five minutes.
 *
 * @param configTimeout The config's test timeout.
 * @param scenario The scenario.
 * @returns The timeout, in milliseconds.
 */
function scenarioTimeout(configTimeout: number, scenario: Scenario): number {
  return Math.max(configTimeout, scenarioBudgetMs(scenario));
}
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
  td: 'cell',
  th: 'column header',
};
/**
 * The sentinels a `sentinels` setup puts around the grid's root container: a button before it and one
 * after it, named so an announcement says which one the focus reached.
 */
const SENTINELS = { before: 'Before the grid', after: 'After the grid' } as const;

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
 * Runs one page action of a step or the setup: a key, typed text, or a call on the instance (read inside
 * the page through the `__hotInstance` the core stamps on the root wrapper, or the fixture's `window.hot`,
 * so a catalog page needs no global of its own), the sentinels around the grid, a focus, or a host event
 * (`call`: a function the fixture puts on `window`, awaited when it returns a promise; one the page lacks
 * fails the test, so a renamed fixture function is never a silent step).
 *
 * @param page The page.
 * @param root The grid's root container selector.
 * @param action The action. A reader primitive (`read`, `activate`) never reaches here.
 */
async function runAction(page: Page, root: string, action: ScenarioAction | SetupAction): Promise<void> {
  if ('press' in action) {
    await page.keyboard.press(action.press);
  } else if ('type' in action) {
    await page.keyboard.type(action.type);
  } else if ('selectCell' in action) {
    const selected = await page.evaluate(([selector, [row, col]]) => {
      const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance ?? (window as HotWindow).hot;

      return hot ? hot.selectCell(row, col) : null;
    }, [root, action.selectCell] as const);

    expect(selected, `selectCell(${action.selectCell.join(', ')}) through the instance of ${root}`).toBe(true);
  } else if ('updateSettings' in action) {
    const updated = await page.evaluate(([selector, settings]) => {
      const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance ?? (window as HotWindow).hot;

      hot?.updateSettings(settings);

      return Boolean(hot);
    }, [root, action.updateSettings] as const);

    expect(updated, `updateSettings() through the instance of ${root}`).toBe(true);
  } else if ('spreadsheetData' in action) {
    const loaded = await page.evaluate(([selector, [rows, columns]]) => {
      const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance ?? (window as HotWindow).hot;
      const helper = (window as HotWindow).Handsontable?.helper;

      if (!hot || !helper) {
        return false;
      }

      hot.loadData(helper.createSpreadsheetData(rows, columns));

      return true;
    }, [root, action.spreadsheetData] as const);

    expect(loaded, `loadData() of ${action.spreadsheetData.join(' x ')} spreadsheet data through the instance of ${root}`).toBe(true);
  } else if ('sentinels' in action) {
    const inserted = await page.evaluate(([selector, labels]) => {
      const container = document.querySelector(selector);

      if (!container) {
        return false;
      }

      Object.entries(labels).forEach(([where, label]) => {
        const button = document.createElement('button');

        button.type = 'button';
        button.textContent = label;
        button.setAttribute('data-sr-sentinel', where);
        container.insertAdjacentElement(where === 'before' ? 'beforebegin' : 'afterend', button);
      });

      return true;
    }, [root, SENTINELS] as const);

    expect(inserted, `the sentinels around ${root}`).toBe(true);
  } else if ('focus' in action) {
    await page.locator(action.focus).first().focus();
    await expect(page.locator(action.focus).first(), `the setup focused ${action.focus}`).toBeFocused();
  } else if ('call' in action) {
    const [name, ...args] = action.call;
    const called = await page.evaluate(async([fn, values]) => {
      const target = (window as unknown as Record<string, unknown>)[fn];

      if (typeof target !== 'function') {
        return false;
      }

      await target(...values);

      return true;
    }, [name, args] as const);

    expect(called, `window.${name}() is a function the page defines`).toBe(true);
  } else {
    throw new Error(`The page does not run the reader primitive ${JSON.stringify(action)}.`);
  }
}

/**
 * Waits for the scenario's grid to be built (the instance on its root wrapper, or the fixture's
 * `window.hot`) and rethrows the constructor error a fixture captured, so a bad setting is a red test with
 * its cause, not a mute timeout. A catalog page does not always set `window.hot`, which is why this does
 * not wait the way `awaitFixtureBuilt()` does.
 *
 * @param page The page.
 * @param root The grid's root container selector.
 */
async function awaitGrid(page: Page, root: string): Promise<void> {
  await page.waitForFunction(selector => Boolean((document.querySelector(selector)?.querySelector('.ht-root-wrapper') as RootWrapper | null)?.__hotInstance)
    || 'hot' in window || 'htBuildError' in window || Boolean(document.querySelector(selector)?.getAttribute('data-init-error')),
  root, { polling: BUNDLE_POLLING_MS });

  const buildError = await page.evaluate(selector => (window as HotWindow).htBuildError
    ?? document.querySelector(selector)?.getAttribute('data-init-error') ?? null, root);

  if (buildError !== null) {
    throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
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
 * @param page The page.
 * @returns The reader.
 */
function guidepupReader(screenReader: ScreenReaderPlaywright, page: Page): Reader {
  if (screenReader.name === 'NVDA') {
    return nvdaReader(screenReader, page);
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
 * - **Into the grid** (`start: grid`): Guidepup leaves VoiceOver's cursor on the first item of the page,
 *   the grid, and `enter()` interacts with it (VO-Shift-Down), the way a VoiceOver user enters a table.
 *   The setup then puts the focus on a cell, and VoiceOver's cursor follows the keyboard focus onto it.
 *   The order matters: interacting once the focus is on a cell takes VoiceOver into the cell's text, and
 *   on Chromium it then announced no cell move at all (in the run that tried it, only the editor and an
 *   API reselection were announced, 2 of 20 steps). With `start: page` VoiceOver interacts with nothing
 *   and its cursor stays on the page's first item, so the steps enter the grid the way the user does.
 *   What VoiceOver says on the way in goes to `entering`.
 * - **Each step**: VoiceOver keeps its last phrase, so a step it says nothing on would read as the
 *   previous step's phrase. Every capture starts with the step boundary as the last phrase
 *   (`markStepBoundary()`), and `stripStepBoundary()` removes it from what the capture read: a
 *   silent step is an empty string, as it is on NVDA. Keys still go to the page through Playwright,
 *   so VoiceOver hears the page react and never the keystroke, on NVDA's terms.
 * - **Reading** (`read`): VO-Right and VO-Left move VoiceOver's cursor to the next and previous item,
 *   VO-Shift-Down and VO-Shift-Up interact with the item and stop interacting (`in`, `out`), and VO-Space
 *   activates it (`activate`), each through Guidepup with its own capture, after the same boundary. A
 *   silent read is not listened to a second time (below).
 * - **Out of the grid**: `leave()` stops interacting (VO-Shift-Up) after the last step.
 *
 * @param screenReader Guidepup's screen reader, VoiceOver.
 * @returns The reader.
 */
function voiceOverReader(screenReader: ScreenReaderPlaywright): Reader {
  // Only the boundary: listen once more for another silence window, as the NVDA reader does, so a phrase
  // VoiceOver speaks late lands on its own step rather than the next one. The boundary is still the last
  // phrase, so a step that stays silent is still an empty string.
  const lateListen = async(spoken: string): Promise<Captured> => {
    if (spoken !== '') {
      return { spoken, preparing: [] };
    }

    const late = await screenReader.capture(async() => {}, { capture: true });

    return { spoken: stripStepBoundary(late.spokenPhrase), preparing: [] };
  };
  // A reader command carries its own capture: Guidepup queues it, so it cannot run inside `capture()`,
  // whose action holds the queue. Its phrase is the last of the log. A cursor move (`read`) is not listened
  // to twice: VoiceOver speaks the item it lands on at once, and a silent one (past the end of a table)
  // costs a whole silence window, about 13 s, which a second listen would double. An activation can open
  // something that speaks late, as a key can, so it is.
  const command = async(perform: () => Promise<unknown>, listenAgain: boolean): Promise<Captured> => {
    await markStepBoundary();
    await perform();

    const spoken = stripStepBoundary(await screenReader.lastSpokenPhrase());

    return listenAgain ? lateListen(spoken) : { spoken, preparing: [] };
  };

  return {
    name: `${screenReader.name} (macOS ${macOSVersion()})`,
    async enter(start) {
      await screenReader.navigateToWebContent();

      if (start === 'grid') {
        await screenReader.interact({ capture: true });
      }
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

      return lateListen(stripStepBoundary(spokenPhrase));
    },
    read(direction) {
      const commands: Record<ReadDirection, () => Promise<unknown>> = {
        next: () => screenReader.next({ capture: true }),
        previous: () => screenReader.previous({ capture: true }),
        in: () => screenReader.interact({ capture: true }),
        out: () => screenReader.stopInteracting({ capture: true }),
      };

      return command(commands[direction], false);
    },
    activate() {
      return command(() => screenReader.act({ capture: true }), true);
    },
    async leave() {
      await screenReader.stopInteracting({ capture: false });
    },
  };
}

/**
 * The NVDA reader.
 *
 * - **Into the page**: Guidepup's `navigateToWebContent()` focuses the browser window and puts NVDA at
 *   the top of the document, in browse mode. NVDA has no interaction level, so `start` changes nothing
 *   here: the setup's selection moves the focus into the grid, and NVDA follows it. On the way Guidepup
 *   clicks the middle of the page and presses Tab, so the reader keeps the cells out of the pointer's
 *   reach meanwhile (`ENTRY_POINTER_GUARD`): a click that selected a cell of the last column sent that
 *   Tab out of the page.
 * - **Its mode follows the primitive.** A page action (`press`, `type`, `selectCell`) runs in focus mode,
 *   where a grid user works; a reading command (`read`, `activate`) runs in browse mode, where NVDA's Down
 *   and Up Arrow read the next and previous item and Enter activates the item under the cursor. Before a
 *   primitive the reader switches when the mode NVDA last named is not the one it needs (NVDA+Space; a
 *   switch is spoken, not played, through the `virtualBuffers.passThroughAudioIndication` setting the
 *   start options turn off), and toggles once more when the switch landed in the other mode: NVDA
 *   switches on its own when the focus lands on a gridcell (its treatment of ARIA grids), and Guidepup
 *   logs only what a command captured. The mode is read from every phrase the reader heard, the last mode
 *   phrase winning, never from the normalized text, which strips the mode phrases as chatter. A switch
 *   that names no mode still flipped it, so the mode follows from the last one NVDA named and the count
 *   of silent switches after it (`ensureNvdaMode()` of `lib/screenreader-nvda.mjs`): the reader keeps
 *   switching for a named mode while two switches are left, a mode it can only infer goes into the
 *   step's `preparing`, and switches that end in the other mode stop the run as tooling. When NVDA has
 *   named no mode in the run, neither on the way in nor by a switch, it is not in the page's document
 *   (its focus on the browser's toolbar, or the Windows Start menu once), where a switch says nothing
 *   and no step would be spoken, so the run stops as tooling and the retry starts over with a fresh
 *   browser and NVDA. What a switch says is the step's `preparing`, never its announcement.
 * - **Each step**: `screenReader.capture(() => …, { capture: true })` for a page action, and NVDA's own
 *   command with its capture for a reading one; both wait a second of silence after the last phrase. A
 *   step whose capture is empty is listened to once more (below).
 *
 * @param screenReader Guidepup's screen reader, NVDA.
 * @param page The page.
 * @returns The reader.
 */
function nvdaReader(screenReader: ScreenReaderPlaywright, page: Page): Reader {
  // The mode NVDA is in, named or inferred from a named one: `null` until NVDA names one in this run,
  // and while it is, a switch that names none means NVDA is not in the page's document (above). What it
  // said on the way in goes into that error.
  let mode: 'focus' | 'browse' | null = null;
  let entered: string[] = [];
  const heard = (phrases: string[]) => {
    mode = lastNvdaMode(phrases) ?? mode;
  };
  const toggle = async(): Promise<string> => {
    await screenReader.perform(NVDAKeyCodeCommands.toggleBetweenBrowseAndFocusMode, { capture: true });

    return screenReader.lastSpokenPhrase();
  };
  const ensure = async(wanted: 'focus' | 'browse'): Promise<string[]> => {
    // A toggle that names no mode still flipped it: assuming the wanted mode after one once sent a read's
    // Down Arrow to the page in focus mode, and the traversal started on a cell (Firefox, the NVDA lane's
    // proof run). The mode follows from the count of toggles since NVDA last named one, and toggles that
    // end in the other mode, or in none, throw, a tooling failure, rather than run the step blind.
    const result = await ensureNvdaMode({ mode, wanted, toggle, entered });

    mode = result.mode;

    return result.said;
  };
  // Nothing within a second of silence: listen once more for another silence window. NVDA can speak
  // more than a second after the action completed (Shift+F10 on Firefox announced the menu that late,
  // and the phrase landed in the next step's capture), so a late phrase usually lands on its own step.
  // Guidepup discards speech that arrives while it stops the previous utterance, so the second listen
  // reduces late phrases in the next step, it does not remove them. Guidepup's silence window is the wait.
  const lateListen = async(spoken: string, preparing: string[]): Promise<Captured> => {
    if (spoken !== '') {
      heard([spoken]);

      return { spoken, preparing };
    }

    const late = await screenReader.capture(async() => {}, { capture: true });

    heard([late.spokenPhrase]);

    return { spoken: late.spokenPhrase, preparing };
  };
  // A reader command carries its own capture: Guidepup queues it, so it cannot run inside `capture()`,
  // whose action holds the queue. Its phrase is the last of the log.
  const command = async(perform: () => Promise<unknown>): Promise<Captured> => {
    const preparing = await ensure('browse');

    await perform();

    return lateListen(await screenReader.lastSpokenPhrase(), preparing);
  };

  return {
    name: `${screenReader.name} ${screenReader.version}`,
    async enter() {
      const guard = await page.addStyleTag({ content: ENTRY_POINTER_GUARD });

      try {
        await screenReader.navigateToWebContent();
      } finally {
        await guard.evaluate(node => (node as Element).remove());
        await guard.dispose();
      }
    },
    async ready() {
      const entering = [...(await screenReader.spokenPhraseLog())];

      heard(entering);
      entered = entering;
      await screenReader.clearSpokenPhraseLog();

      return entering;
    },
    async capture(action) {
      const preparing = await ensure('focus');
      const { spokenPhrase } = await screenReader.capture(action, { capture: true });

      return lateListen(spokenPhrase, preparing);
    },
    read(direction) {
      if (direction !== 'next' && direction !== 'previous') {
        throw new Error(`NVDA drives no "read ${direction}": the step must declare unsupported.nvda (LANE_PRIMITIVES).`);
      }

      return command(() => (direction === 'next' ? screenReader.next({ capture: true }) : screenReader.previous({ capture: true })));
    },
    activate() {
      return command(() => screenReader.act({ capture: true }));
    },
  };
}

/**
 * The reader of the `dom-echo` lane: the accessible name, role (in the words a screen reader speaks,
 * `SPOKEN_ROLES`), grid position and states of an element, read from the DOM two frames after the action
 * (the focus settles a frame after some keys). A page action echoes the focused element; `read` moves a
 * virtual cursor over the page's readable items (cells, headers and controls, in document order, skipping
 * what is hidden or `aria-hidden`), starting from the focused element, and echoes the item it lands on
 * (`in` and `out` are silent: the echo has no interaction level); `activate` clicks the item
 * under the cursor and echoes the focused element. It always announces something, so a step a screen
 * reader stays silent on announces here: it proves the fixture, the keys, the `after` states, the reading
 * steps' plumbing and the report, never the wording, and never what a virtual buffer holds.
 *
 * @param page The page.
 * @returns The reader.
 */
function domEchoReader(page: Page): Reader {
  const echo = (command: { read?: ReadDirection; activate?: boolean }): Promise<Captured> => page.evaluate(([roles, { read, activate }]) => new Promise<Captured>((resolve) => {
    type CursorWindow = Window & { srCursor?: Element | null };
    const cursorWindow = window as CursorWindow;
    const readable = (): Element[] => {
      const items: Element[] = [];
      const walk = (element: Element) => {
        const style = getComputedStyle(element);

        if (element.getAttribute('aria-hidden') === 'true' || style.display === 'none' || style.visibility === 'hidden') {
          return;
        }

        const role = element.getAttribute('role');

        if (['TD', 'TH', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A'].includes(element.tagName)
          || ['gridcell', 'columnheader', 'rowheader', 'menuitem', 'menuitemcheckbox', 'option', 'button', 'checkbox', 'link', 'tab'].includes(role ?? '')) {
          items.push(element);

          return;
        }

        [...element.children].forEach(walk);
      };

      walk(document.body);

      return items;
    };
    const describe = (element: Element | null): string => {
      if (!element || element === document.body) {
        return '';
      }

      const live = [...document.querySelectorAll('[aria-live]')].map(region => region.textContent?.trim() ?? '').filter(Boolean);
      // A field's name is its value; a button's empty `value` is no name, so its text is.
      const value = element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement ? element.value : '';
      const name = element.getAttribute('aria-label') ?? (value || element.textContent?.trim() || '');
      const rawRole = element.getAttribute('role') ?? element.tagName.toLowerCase();
      const role = Object.hasOwn(roles, rawRole) ? roles[rawRole] : rawRole;
      const row = element.closest('tr')?.getAttribute('aria-rowindex');
      const col = element.getAttribute('aria-colindex');
      const described = element.getAttribute('aria-describedby')?.split(' ').map(id => document.getElementById(id)?.textContent?.trim()).filter(Boolean).join(' ');
      const states = ['aria-sort', 'aria-expanded', 'aria-selected', 'aria-checked'].map(attr => (element.hasAttribute(attr) ? `${attr.slice(5)} ${element.getAttribute(attr)}` : null)).filter(Boolean);

      return [name, role, described, row ? `row ${row}` : '', col ? `column ${col}` : '', ...states, ...live].filter(Boolean).join('. ');
    };

    if (read) {
      const items = readable();
      const from = cursorWindow.srCursor && cursorWindow.srCursor.isConnected ? cursorWindow.srCursor : document.activeElement;
      let index = from ? items.indexOf(from) : -1;

      // The cursor is not an item (the body, a container): start from the first item after it.
      if (index === -1 && from && from !== document.body) {
        // eslint-disable-next-line no-bitwise
        index = items.findIndex(item => (from.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0) - 1;
      }
      // Past either end of the page the cursor stays on the last item it read, and the step is silent,
      // as a reader at the end of the document says nothing new. The echo has no interaction level, so
      // `in` and `out` move nothing and say nothing.
      const moved = { next: index + 1, previous: index - 1, in: -1, out: -1 }[read];

      if (moved < 0 || moved >= items.length) {
        resolve({ spoken: '', preparing: [] });

        return;
      }
      cursorWindow.srCursor = items[moved] ?? null;
    }
    if (activate) {
      (cursorWindow.srCursor as HTMLElement | null | undefined)?.click();
    }

    requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve({ spoken: describe(read ? cursorWindow.srCursor ?? null : document.activeElement), preparing: [] });
    }));
  }), [SPOKEN_ROLES, command] as const);

  return {
    name: 'dom-echo (the focused element, no screen reader)',
    async enter() {},
    async ready() {
      return [];
    },
    async capture(action) {
      await action();

      return echo({});
    },
    read(direction) {
      return echo({ read: direction });
    },
    activate() {
      return echo({ activate: true });
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
  unsupported: TranscriptUnsupportedStep[];
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
    page: scenarioPageId(scenario),
    criteria: scenario.criteria,
    project,
    lane: laneOfProject(project),
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
    unsupported: run.unsupported,
    // A traversal is judged on a complete run only: a run that stopped read part of it, and every item
    // after the stop would read as never announced.
    ...(scenario.traversal && !run.incomplete ? { traversal: matchTraversal(run.steps, scenario.traversal) } : {}),
    golden: { status: 'incomplete', differences: [] },
    ...(run.incomplete ? { incomplete: run.incomplete } : {}),
  };

  if (!run.incomplete && updatesGoldens(testInfo)) {
    const recorded = `${JSON.stringify(goldenFromTranscript(transcript), null, 2)}\n`;
    const recordedFile = path.join(RECORDED_GOLDENS_DIR, project, `${scenario.id}.json`);

    mkdirSync(path.dirname(goldenFile), { recursive: true });
    writeFileSync(goldenFile, recorded);
    mkdirSync(path.dirname(recordedFile), { recursive: true });
    writeFileSync(recordedFile, recorded);
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
  const unsupported: TranscriptUnsupportedStep[] = [];
  const lane = laneOfProject(testInfo.project.name);
  const { root } = scenarioPlace(scenario);
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
    await awaitGrid(page, root);
    await reader.enter(scenario.start ?? 'grid');

    for (const action of scenario.setup ?? []) {
      await runAction(page, root, action);
    }

    entering = await reader.ready();

    for (const step of scenario.steps) {
      running = step.id;

      // A step the lane cannot drive is skipped there and listed, with the reason the scenario gives:
      // the report shows it as a gap, and the golden of this lane holds the steps it ran.
      const reason = unsupportedReason(step, lane);

      if (reason !== null) {
        unsupported.push({ id: step.id, action: step.action, reason });
        continue;
      }

      const stepStarted = Date.now();
      const { action } = step;
      let captured: Captured;

      if ('read' in action) {
        captured = await reader.read(action.read);
        await awaitAfter(page, step);
      } else if ('activate' in action) {
        captured = await reader.activate();
        await awaitAfter(page, step);
      } else {
        captured = await reader.capture(async() => {
          await runAction(page, root, action);
          await awaitAfter(page, step);
        });
      }

      const normalized = normalizeAnnouncement(captured.spoken);

      steps.push({
        id: step.id,
        action,
        spoken: captured.spoken,
        normalized,
        tokens: matchTokenGroups(normalized, step.expect, step.severity),
        durationMs: Date.now() - stepStarted,
        ...(captured.preparing.length > 0 ? { preparing: captured.preparing } : {}),
      });
    }
  } catch (error) {
    incomplete = { step: running, error: errorText(error) };

    throw error;
  } finally {
    await writeTranscript(page, reader, scenario, testInfo, { startedAt, started, steps, unsupported, entering, incomplete });
  }

  // After the transcript, on a complete run only. Leaving changes nothing the transcript records, so a
  // failure is a warning in the report and the log, never a red test that `retries: 2` would rerun
  // (minutes on VoiceOver) and whose rerun would overwrite the complete transcript. A run that threw
  // leaves the screen reader to the fixture, which stops it either way.
  try {
    await reader.leave?.();
  } catch (error) {
    testInfo.annotations.push({ type: 'warning', description: `Leaving the grid after a complete run failed: ${errorText(error)}` });
    console.warn(`${testInfo.project.name} ${scenario.id}: leaving the grid after a complete run failed:`, error);
  }

  if (SCREENREADER_MODE === 'gate') {
    const failed = steps.filter(step => !step.tokens.passed).map(step => step.id);

    expect(failed, 'steps whose announcement misses a token group').toEqual([]);
  }
}

/**
 * The scenario group this run takes (`HOT_SR_GROUP`, one matrix entry of the lane workflow), or every
 * scenario when it is unset, as a local run is. An unknown group throws: a typo would run nothing and
 * report a clean, empty job.
 */
const GROUP = process.env.HOT_SR_GROUP || undefined;

if (GROUP !== undefined && !SCENARIO_GROUPS.includes(GROUP)) {
  throw new Error(`HOT_SR_GROUP must be one of ${SCENARIO_GROUPS.join(', ')}, received "${GROUP}".`);
}

// A file that does not validate stays in the list in every group, so its red test is never filtered out.
const scenarios = loadScenarios(SCENARIOS_DIR, { fixtures: FIXTURES })
  .filter(({ scenario, problems }) => GROUP === undefined || problems.length > 0 || scenario?.group === GROUP);

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
      testInfo.setTimeout(scenarioTimeout(testInfo.timeout, scenario));
      await runScenario(page, guidepupReader(screenReader, page), scenario, testInfo);
    });
  }
}
