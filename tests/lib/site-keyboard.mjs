/**
 * The keyboard walk of a site: the pure half.
 *
 * `a11y/sites/keyboard.spec.ts` presses real keys on a deployed page: Tab from the top of the document to a
 * sentinel after its last element, the skip link, every popup the header opens, the printable keys with
 * nothing focused, and an input on each form control the walk stopped on. It reads each stop's role and name
 * from Chromium's accessibility tree. The verdicts are here:
 *
 * - 2.1.1: a popup whose items no key reaches.
 * - 2.1.2: a walk that cycles and that Escape does not break.
 * - 2.1.4: a printable key that does something while nothing has the focus.
 * - 2.4.1: a skip link that is not the first stop, that stays hidden when focused, or whose next Tab lands
 *   outside the main content.
 * - 2.4.3: a stop on an element nobody can see, a positive `tabindex`, a popup that leaves the focus nowhere
 *   when it closes, a modal the focus walks out of.
 * - 3.2.1 and 3.2.2: a Tab that navigated or opened a dialog, an input that did.
 * - 4.1.2: a stop whose role needs a name and has none, and a stop with no role.
 *
 * A stop is reported once per shape (its tag, first class and role) per page: one defect on a hundred
 * sidebar links is one finding with a count, not a hundred. Policy: `tests/AGENTS.md`, "A11y: the site
 * checks beyond axe". No I/O in here.
 */

/**
 * The roles whose focusable element needs an accessible name (4.1.2).
 */
export const NAMED_ROLES = new Set(['button', 'link', 'textbox', 'searchbox', 'combobox', 'checkbox', 'radio', 'switch',
  'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'slider', 'spinbutton', 'listbox', 'treeitem',
  'dialog', 'alertdialog', 'PopUpButton', 'MenuListPopup', 'TextField', 'ComboBoxSelect']);
// The roles Chromium gives an element that exposes no semantics of its own.
const ROLELESS = new Set(['', 'generic', 'none', 'presentation', 'GenericContainer', 'Unknown']);

/**
 * How a walk ended: it reached the sentinel on the far side of the page (`complete`: the one after it for a Tab walk,
 * the one before it for a Shift+Tab walk), a key press loaded another page (`navigated`), it came back to a stop it
 * had passed (`cycle`), it ran out of presses (`budget`), or nothing past an embedded grid took the focus
 * (`stopped`). Only `complete` and `cycle` walked the whole page: after any other the stops past the last one were
 * never reached, and `walkProblem()` names why.
 *
 * @param {{stops: Array<{key: string, region: string, navigated?: boolean}>, budgetExhausted?: boolean,
 *   direction?: 'forward'|'backward'}} walk The walk, and which way it went.
 * @returns {'complete'|'navigated'|'cycle'|'budget'|'stopped'} The verdict.
 */
export function walkVerdict({ stops, budgetExhausted = false, direction = 'forward' }) {
  const farSide = direction === 'forward' ? 'end' : 'start';

  if (stops.some(stop => stop.region === farSide)) {
    return 'complete';
  }
  if (stops.length > 0 && stops[stops.length - 1].navigated) {
    return 'navigated';
  }

  const seen = new Set();

  for (const stop of stops.filter(item => item.region === 'page')) {
    if (seen.has(stop.key)) {
      return 'cycle';
    }
    seen.add(stop.key);
  }

  return budgetExhausted ? 'budget' : 'stopped';
}

/**
 * The tooling problem of a walk that did not reach the end of the page, so its target is not reported as measured
 * (a check's finding on a stop it never reached would read as resolved); `null` for a walk that did.
 *
 * @param {'complete'|'navigated'|'cycle'|'budget'|'stopped'} verdict What `walkVerdict()` returned.
 * @param {number} budget How many presses the walk had.
 * @returns {string|null} The problem.
 */
export function walkProblem(verdict, budget) {
  if (verdict === 'navigated') {
    return 'a key press loaded another page before the walk reached the end of this one, so the stops after it were not walked';
  }
  if (verdict === 'budget') {
    return `the walk ran out of its ${budget} presses before the end of the page`;
  }
  if (verdict === 'stopped') {
    return 'the walk stopped before the end of the page: nothing past an embedded grid that held it took the focus';
  }

  return null;
}

/**
 * The findings of a Tab walk: a trap, and per stop shape the hidden, unnamed, roleless and positively indexed
 * stops, and the Tab that changed the context.
 *
 * @param {object} input The walk.
 * @param {Array<object>} input.stops The stops: `key`, `shape`, `region` (`page`, `end`, `body`), `role`, `name`,
 *   `hidden` (why nobody sees it, or `null`), `ariaHidden`, `tabindex`, `navigated`, `dialogOpened`.
 * @param {'complete'|'navigated'|'cycle'|'budget'|'stopped'} input.verdict What `walkVerdict()` returned.
 * @param {boolean} [input.escaped] Whether Escape and Tab got a cycling walk out.
 * @param {boolean} [input.gridTrap] Whether an embedded grid held the walk past the documented way out of it.
 * @returns {object[]} The findings.
 */
export function walkFindings({ stops, verdict, escaped = false, gridTrap = false }) {
  const findings = [];

  if (gridTrap) {
    const last = [...stops].reverse().find(stop => stop.region === 'grid');

    findings.push({ kind: 'grid-holds-focus', criteria: ['2.1.2'], severity: 'serious', selector: last?.shape ?? 'grid', step: 'Tab walk',
      measured: { stops: stops.filter(stop => stop.region === 'grid').length },
      reason: 'An example grid on the page keeps the Tab key: neither Tab nor the documented way out (Ctrl+End, then Tab) leaves it' });
  }

  if (verdict === 'cycle') {
    const first = stops.find((stop, index) => stops.findIndex(other => other.key === stop.key) !== index);

    findings.push(escaped
      ? { kind: 'tab-walk-cycles', criteria: ['2.1.2'], severity: 'advisory', selector: first?.shape ?? 'page', step: 'Tab walk',
        measured: { stops: stops.length },
        reason: 'Tab came back to a stop before it reached the end of the page; Escape let the keyboard out, so a person checks it is a modal' }
      : { kind: 'keyboard-trap', criteria: ['2.1.2'], severity: 'critical', selector: first?.shape ?? 'page', step: 'Tab walk',
        measured: { stops: stops.length },
        reason: 'Tab cycles among the same stops and never reaches the end of the page, and Escape does not let the keyboard out' });
  }

  const byShape = new Map();

  for (const stop of stops.filter(item => item.region === 'page')) {
    byShape.set(stop.shape, [...(byShape.get(stop.shape) ?? []), stop]);
  }
  for (const [shape, list] of byShape) {
    const hidden = list.filter(stop => stop.hidden);
    const ariaHidden = list.filter(stop => stop.ariaHidden);
    const unnamed = list.filter(stop => NAMED_ROLES.has(stop.role) && String(stop.name ?? '').trim() === '');
    const roleless = list.filter(stop => ROLELESS.has(String(stop.role ?? '')) && !stop.hidden && !stop.ariaHidden);
    const positive = list.filter(stop => Number(stop.tabindex) > 0);

    if (hidden.length > 0) {
      findings.push({ kind: 'focus-stop-hidden', criteria: ['2.4.3', '2.4.7'], severity: 'serious', selector: shape,
        measured: { count: hidden.length, why: hidden[0].hidden, name: String(hidden[0].name ?? '').slice(0, 60) },
        reason: 'Tab stops on an element nobody can see, so a keyboard user loses track of the focus' });
    }
    if (ariaHidden.length > 0) {
      findings.push({ kind: 'focus-stop-aria-hidden', criteria: ['4.1.2'], severity: 'serious', selector: shape,
        measured: { count: ariaHidden.length }, reason: 'Tab stops on an element the accessibility tree hides, so a screen reader says nothing there' });
    }
    if (unnamed.length > 0) {
      findings.push({ kind: 'focus-stop-unnamed', criteria: ['4.1.2'], severity: 'serious', selector: shape,
        measured: { count: unnamed.length, role: unnamed[0].role }, reason: `A focusable ${unnamed[0].role} has no accessible name` });
    }
    if (roleless.length > 0) {
      findings.push({ kind: 'focus-stop-without-role', criteria: ['4.1.2'], severity: 'moderate', selector: shape,
        measured: { count: roleless.length, name: String(roleless[0].name ?? '').slice(0, 60) },
        reason: 'Tab stops on an element with no role, so a screen reader cannot say what it is' });
    }
    if (positive.length > 0) {
      findings.push({ kind: 'tabindex-positive', criteria: ['2.4.3'], severity: 'moderate', selector: shape,
        measured: { count: positive.length, tabindex: Number(positive[0].tabindex) },
        reason: 'A positive tabindex moves the element ahead of the reading order' });
    }
  }

  const changed = new Map();

  for (const stop of stops.filter(item => item.navigated || item.dialogOpened)) {
    if (!changed.has(stop.shape)) {
      changed.set(stop.shape, stop);
    }
  }
  for (const [shape, stop] of changed) {
    findings.push({ kind: 'context-change-on-focus', criteria: ['3.2.1'], severity: 'serious', selector: shape,
      measured: { navigated: Boolean(stop.navigated), dialogOpened: Boolean(stop.dialogOpened) },
      reason: stop.navigated ? 'Moving the focus here with Tab loaded another page' : 'Moving the focus here with Tab opened a dialog' });
  }

  return findings;
}

/**
 * The skip link findings (2.4.1, 2.4.7): a page that has a skip link and does not stop on it first, a skip link
 * that stays out of sight when it has the focus, and one whose next Tab does not land in the main content.
 *
 * @param {object} input What the spec measured.
 * @param {boolean} input.present Whether the page has a skip link.
 * @param {boolean} input.first Whether the first Tab stop is a skip link.
 * @param {boolean|null} input.visible Whether the skip link is visible when focused; `null` when not measured.
 * @param {boolean|null} input.landsInMain Whether the Tab after activating it lands in the main content; `null` when not measured.
 * @param {string} [input.selector] The skip link.
 * @returns {object[]} The findings.
 */
export function skipLinkFindings({ present, first, visible, landsInMain, selector = 'a[href^="#"]' }) {
  if (!present) {
    return [];
  }

  const findings = [];

  if (!first) {
    findings.push({ kind: 'skip-link-not-first', criteria: ['2.4.1'], severity: 'moderate', selector, step: 'Tab 1',
      reason: 'The skip link is not the first Tab stop, so a keyboard user passes other stops before reaching it' });
  }
  if (visible === false) {
    findings.push({ kind: 'skip-link-hidden-on-focus', criteria: ['2.4.1', '2.4.7'], severity: 'serious', selector, step: 'Tab 1',
      reason: 'The skip link stays out of sight when it has the focus, so a sighted keyboard user never sees it' });
  }
  if (landsInMain === false) {
    findings.push({ kind: 'skip-link-does-not-skip', criteria: ['2.4.1'], severity: 'serious', selector, step: 'Enter, then Tab',
      reason: 'After the skip link, the next Tab lands outside the main content, so it bypasses nothing' });
  }

  return findings;
}

/**
 * The findings of one popup the header opens (a menu, a panel, a dialog): its items unreachable from the
 * keyboard, an Escape that leaves it open, a focus left nowhere when it closes, and a modal the focus walks
 * out of.
 *
 * @param {object} input What the spec measured.
 * @param {string} input.state The popup (`versions-menu`).
 * @param {string} input.selector The control that opens it.
 * @param {boolean} input.reachedItem Whether Tab or ArrowDown reached a control inside it.
 * @param {boolean} input.closedOnEscape Whether Escape closed it.
 * @param {boolean} input.focusReturned Whether the focus came back to the control that opened it.
 * @param {boolean} [input.modal] Whether it is a modal dialog.
 * @param {boolean} [input.leftModal] Whether a Tab walked out of it while it was open.
 * @returns {object[]} The findings.
 */
export function popupFindings({ state, selector, reachedItem, closedOnEscape, focusReturned, modal = false, leftModal = false }) {
  const findings = [];

  if (!reachedItem) {
    findings.push({ kind: 'popup-items-unreachable', criteria: ['2.1.1'], severity: 'serious', selector, step: `${state}: Tab and ArrowDown`,
      reason: 'Neither Tab nor ArrowDown reaches a control inside the popup' });
  }
  if (modal && leftModal) {
    findings.push({ kind: 'focus-leaves-modal', criteria: ['2.4.3'], severity: 'serious', selector, step: `${state}: Tab`,
      reason: 'Tab walks out of the open modal dialog to the page behind it' });
  }
  if (!closedOnEscape) {
    findings.push({ kind: 'popup-escape-ignored', criteria: ['2.1.1'], severity: 'moderate', selector, step: `${state}: Escape`,
      reason: 'Escape does not close the popup' });
  } else if (!focusReturned) {
    findings.push({ kind: 'focus-not-returned', criteria: ['2.4.3'], severity: 'moderate', selector, step: `${state}: Escape`,
      reason: 'When the popup closed, the focus did not come back to the control that opened it' });
  }

  return findings;
}

/**
 * The 2.1.4 findings of the printable keys pressed with nothing focused: a key that navigated, opened a dialog
 * or moved the focus. 2.1.4 allows such a shortcut when the user can turn it off or remap it, which no key press
 * can tell, so the finding says what to check.
 *
 * @param {Array<{key: string, navigated: boolean, dialogOpened: boolean, focused: string|null}>} results The keys pressed.
 * @returns {object[]} The findings.
 */
export function shortcutFindings(results) {
  return results.filter(result => result.navigated || result.dialogOpened || result.focused).map(result => ({
    kind: 'single-key-shortcut', criteria: ['2.1.4'], severity: 'serious', step: `key "${result.key}"`,
    measured: { navigated: result.navigated, dialogOpened: result.dialogOpened, focused: result.focused ?? '' },
    reason: `Pressing "${result.key}" with nothing focused acts on its own; unless a setting turns it off or remaps it, a speech or a slip of the keyboard sets it off`,
  }));
}

/**
 * The 3.2.2 findings of an input on a form control the walk stopped on: an input that navigated, opened a
 * dialog or moved the focus away.
 *
 * @param {Array<{selector: string, key: string, navigated: boolean, dialogOpened: boolean, focusMoved: boolean}>} results The inputs.
 * @returns {object[]} The findings.
 */
export function inputFindings(results) {
  return results.filter(result => result.navigated || result.dialogOpened || result.focusMoved).map(result => ({
    kind: 'context-change-on-input', criteria: ['3.2.2'], severity: 'serious', selector: result.selector, step: `${result.key} on the control`,
    measured: { navigated: result.navigated, dialogOpened: result.dialogOpened, focusMoved: result.focusMoved },
    reason: 'Changing the control\'s value changed the context without a warning',
  }));
}

/**
 * The 2.1.1 findings of controls no key reaches: an element with a widget role or a click handler in its markup
 * that cannot take the focus and sits inside nothing that can. One finding per shape, with a count.
 *
 * @param {Array<{shape: string, role: string, name: string}>} controls The controls the spec found.
 * @returns {object[]} The findings.
 */
export function unreachableFindings(controls) {
  const byShape = new Map();

  for (const control of controls) {
    byShape.set(control.shape, [...(byShape.get(control.shape) ?? []), control]);
  }

  return [...byShape].map(([shape, list]) => ({
    kind: 'control-not-focusable', criteria: ['2.1.1'], severity: 'serious', selector: shape,
    measured: { count: list.length, role: list[0].role, name: String(list[0].name ?? '').slice(0, 60) },
    reason: 'A control that acts on a click cannot take the keyboard focus, so a keyboard user cannot use it',
  }));
}
