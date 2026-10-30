/**
 * The keyboard walker: the pure half.
 *
 * `a11y/checks/keyboard-walker.spec.ts` presses the keys and records what it saw: every focus stop of
 * a Tab walk (its region, accessible role and name, the cell it is on), whether Escape closed a popup
 * and where the focus went, and a snapshot of the grid around every documented shortcut it probes.
 * Everything that turns those records into a verdict or a finding is here, so it is proven without a
 * browser (`lib/__tests__/keyboard-walker.test.mjs`). The criteria: 2.1.1 Keyboard, 2.1.2 No Keyboard
 * Trap, 2.1.4 Character Key Shortcuts, 2.4.3 Focus Order, 3.2.1 On Focus, 3.2.2 On Input, and 4.1.2
 * for a focus stop with no name or role. The policy is `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

export const WALKER_CHECK = 'keyboard-walker';
export const WALKER_CRITERIA = ['2.1.1', '2.1.2', '2.1.4', '2.4.3', '3.2.1', '3.2.2'];
/**
 * Where a focus stop is: the sentinels the walker puts right before (`start`) and right after (`end`)
 * the grid's root container, the root itself (`grid`), the grid's own portal (`portal`), anything else
 * on the fixture page (`outside`), or no element at all (`body`: the focus left the page, or the focused
 * element went away). Playwright emulates page focus, so `document.hasFocus()` cannot tell the two apart;
 * `walkFindings()` tells them by the stop before.
 */
export const REGIONS = ['start', 'end', 'grid', 'portal', 'outside', 'body'];
const PRODUCT = new Set(['grid', 'portal']);
// The roles a focused element must carry a name for. A grid cell is not one: an empty cell has an
// empty name, and that is its value, not a missing label. `Date`, `DateTime` and `InputTime` are the
// roles Chromium's accessibility tree gives a native date, datetime-local and time input.
const NAMED_ROLES = new Set(['button', 'link', 'checkbox', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'tab', 'textbox',
  'combobox', 'searchbox', 'spinbutton', 'switch', 'radio', 'slider', 'columnheader', 'rowheader', 'treeitem', 'listbox', 'menu', 'dialog',
  'alertdialog', 'Date', 'DateTime', 'InputTime']);
const NO_ROLE = new Set(['', 'generic', 'none', 'presentation']);

/**
 * The identity of a focus stop within one walk. A grid cell is keyed by its coordinates, never by its
 * element: Walkontable reuses the same `<td>` for another cell after a scroll.
 *
 * @param {{region: string, cell?: number[]|null, ref?: string|number}} stop The stop.
 * @returns {string} The key.
 */
export function stopKey(stop) {
  return stop.cell ? `${stop.region}|cell|${stop.cell[0]},${stop.cell[1]}` : `${stop.region}|${stop.ref}`;
}

/**
 * Whether a stop is inside the product: the grid's root container or its portal.
 *
 * @param {{region: string}} stop The stop.
 * @returns {boolean} Whether it is.
 */
export function isProductStop(stop) {
  return PRODUCT.has(stop.region);
}

/**
 * What a Tab walk shows. The walk starts on one sentinel and presses Tab (or Shift+Tab, `backward`)
 * until the focus reaches the other one, leaves the document, comes back to a stop it already
 * visited, or runs out of presses. A walk that reaches the other sentinel or leaves the document left
 * the grid. One that cycles or runs out while the focus is in the product is a trap, unless the cycle
 * is a modal dialog, which keeps the focus by design (the caller then checks that it has an exit).
 *
 * @param {object} input The walk.
 * @param {'forward'|'backward'} input.direction Tab or Shift+Tab.
 * @param {object[]} input.stops The stops: the starting sentinel, then one per press.
 * @param {boolean} [input.budgetExhausted] Whether the walk stopped because it ran out of presses.
 * @param {{keys: string, left: boolean|'body', presses: number, from?: {region: string, locator: string}}|null} [input.exitRoute] What
 *   the documented way out did after the presses ran out: Ctrl+End then Tab (Ctrl+Home then Shift+Tab backward), which leaves a
 *   grid whose Tab wraps from row to row (`autoWrapRow`) from its last cell. `left` is `true` when the focus reached the other
 *   sentinel, `'body'` when it left no element focused (`from` is the stop the last press left), `false` when it never got out.
 *   A walk that got out either way is long, not a trap; `walkFindings()` judges the `'body'` exit.
 * @returns {{reachedEnd: boolean, leftDocument: boolean, cycle: {from: number, to: number}|null, trapped: boolean, presses: number, productStops: number, modal: boolean, exitRoute: object|null}} The verdict.
 */
export function walkVerdict({ direction, stops, budgetExhausted = false, exitRoute = null }) {
  const goal = direction === 'forward' ? 'end' : 'start';
  const reachedEnd = stops.slice(1).some(item => item.region === goal);
  const leftDocument = stops.slice(1).some(item => item.region === 'body');
  let cycle = null;
  const seen = new Map();

  stops.forEach((item, index) => {
    const key = stopKey(item);

    if (cycle === null && seen.has(key) && index > 0) {
      cycle = { from: seen.get(key), to: index };
    } else if (!seen.has(key)) {
      seen.set(key, index);
    }
  });

  const held = cycle ? stops.slice(cycle.from, cycle.to) : stops.slice(-1);
  const trapped = !reachedEnd && !leftDocument && (cycle !== null || (budgetExhausted && !exitRoute?.left))
    && held.length > 0 && held.every(isProductStop);

  return {
    reachedEnd,
    leftDocument,
    cycle,
    trapped,
    presses: Math.max(0, stops.length - 1),
    productStops: stops.filter(isProductStop).length,
    modal: trapped && held.every(item => item.modal === true),
    exitRoute: budgetExhausted && cycle === null ? exitRoute : null,
  };
}

/**
 * The findings of one Tab walk: a stop in the product with no role or no name it needs (4.1.2), a
 * press that changed the context instead of only moving the focus (3.2.1), a press that moved the focus
 * out of an open modal dialog to the content behind it or left no element focused (2.4.3), and a trap (2.1.2). A
 * modal dialog that holds the focus is not a trap when it has an exit (`modalExit` says which); the
 * fixture's own stops are never judged.
 *
 * @param {object} input The walk.
 * @param {object} input.walk What `walkVerdict()` returned.
 * @param {object[]} input.stops The stops.
 * @param {'forward'|'backward'} input.direction The direction.
 * @param {string|null} [input.modalExit] How the modal dialog that holds the focus can be left, or `null`.
 * @param {boolean} [input.opened] Whether the first stop after the sentinel is where a popup put the focus (no key pressed
 *   yet), so the steps count one press fewer, and a Tab that left the focus on that element is an advisory
 *   `tab-keeps-focus`.
 * @param {Set<string>} [input.reported] The findings already reported on this page: the forward and the backward walk
 *   share one, because a stop's role and name do not depend on the walk that reached it, so a stop both walks pass is
 *   one role or name finding, not one per direction, which would double the summary counts. A focus loss, a Tab out of a
 *   modal and a change of context on focus depend on the key pressed, so they are kept per direction: Tab and Shift+Tab
 *   losing the focus from one cell are two defects, and fixing one leaves the other.
 * @returns {object[]} The findings.
 */
export function walkFindings({ walk, stops, direction, modalExit = null, opened = false, reported = new Set() }) {
  const findings = [];
  const key = direction === 'forward' ? 'Tab' : 'Shift+Tab';
  const label = (index) => {
    const press = opened ? index - 1 : index;

    return press === 0 ? 'where the popup put the focus' : `${key} ${press}`;
  };
  const add = (kind, item, index, finding) => {
    const perStop = kind === 'focus-stop-without-role' || kind === 'focus-stop-unnamed';
    const key = `${kind}|${stopKey(item)}${perStop ? '' : `|${direction}`}`;

    if (!reported.has(key)) {
      reported.add(key);
      findings.push({ kind, selector: item.locator ?? item.tag ?? item.region, step: label(index), ...finding });
    }
  };

  stops.forEach((item, index) => {
    const previous = stops[index - 1];

    if (index > 0 && previous.modal === true && item.modal !== true) {
      add('focus-leaves-modal', previous, index, {
        criteria: ['2.4.3'],
        severity: 'serious',
        measured: { to: item.region },
        reason: 'The focus walked out of an open modal dialog to the content behind it, which the dialog hides from assistive technology',
      });
    } else if (index > 0 && item.region === 'body' && previous.region === 'grid') {
      // The sentinels sit right before and right after the grid's container, so a key pressed inside it reaches
      // one of them or another stop: no element focused means the focused element went away. A portal can be
      // the last focusable element of the page, where Tab leaves the page, so a portal stop is not judged.
      add('focus-lost', previous, index, {
        criteria: ['2.4.3'],
        severity: 'serious',
        measured: { to: 'body' },
        reason: `${key} from inside the grid left no element focused: the focused element went away instead of passing the focus on, so a screen reader has nothing to announce`,
      });
    }
    if (index === 0 || !isProductStop(item)) {
      return;
    }

    const role = String(item.role ?? '');

    if (item.ignored === true || NO_ROLE.has(role)) {
      add('focus-stop-without-role', item, index, {
        criteria: ['4.1.2'],
        severity: 'serious',
        measured: { role: role || 'none', ignored: item.ignored === true },
        reason: 'The focus lands on an element the accessibility tree gives no role, so a screen reader cannot say what has the focus',
      });
    } else if (NAMED_ROLES.has(role) && String(item.name ?? '').trim() === '') {
      add('focus-stop-unnamed', item, index, {
        criteria: ['4.1.2'],
        severity: 'serious',
        measured: { role },
        reason: `The focus lands on a ${role} with no accessible name`,
      });
    }
    if (item.contextChange) {
      add('context-change-on-focus', item, index, {
        criteria: ['3.2.1'],
        severity: 'serious',
        measured: { change: item.contextChange },
        reason: 'Moving the focus here changed the context, which a focus move alone must not do',
      });
    }
  });

  const last = stops.at(-1);

  // A popup walk stops on the first stop it reached twice; one whose last Tab left the focus where it was
  // never got past that element.
  if (opened && stops.length > 2 && isProductStop(last) && stopKey(last) === stopKey(stops.at(-2))) {
    findings.push({
      kind: 'tab-keeps-focus',
      criteria: ['2.1.1'],
      severity: 'advisory',
      selector: last.locator ?? last.tag ?? last.region,
      step: label(stops.length - 1),
      measured: { editorOpen: last.signals?.editorOpen === true },
      reason: `${key} left the focus on the element it was on, so the walk inside the popup stopped: review whether it moved within the control `
        + '(a date input\'s fields), took the key as input (a suggestion accepted) or did nothing, where the guide says Tab completes the entry and moves on',
    });
  }
  // The way out can lose the focus the way a walk does: a press from inside the grid's container that leaves no element
  // focused. From the portal it may have left the page, as in a walk, so that is not judged.
  if (walk.exitRoute?.left === 'body' && walk.exitRoute.from?.region === 'grid') {
    // No Tab of the way out pressed (`presses` 0): the route key itself lost the focus.
    const lostOn = walk.exitRoute.presses === 0 ? walk.exitRoute.keys.split(', then ')[0] : walk.exitRoute.keys;

    findings.push({
      kind: 'focus-lost',
      criteria: ['2.4.3'],
      severity: 'serious',
      selector: walk.exitRoute.from.locator ?? 'grid',
      step: `${label(walk.presses)}, then ${lostOn}${walk.exitRoute.presses === 0 ? '' : ` ${walk.exitRoute.presses}`}`,
      measured: { to: 'body' },
      reason: `${lostOn} from inside the grid left no element focused: the focused element went away instead of passing `
        + 'the focus on, so a screen reader has nothing to announce',
    });
  }
  if (walk.exitRoute?.left && !walk.trapped) {
    findings.push({
      kind: 'tab-walk-needs-shortcut',
      criteria: ['2.1.2'],
      severity: 'advisory',
      step: `${label(walk.presses)}, then ${walk.exitRoute.keys}`,
      measured: { presses: walk.presses, routePresses: walk.exitRoute.presses },
      reason: `${key} moves from cell to cell and wraps rows, so leaving the grid took more than ${walk.presses} presses; `
        + `${walk.exitRoute.keys} left it, as the shortcut guide documents`,
    });
  }
  // A walk that came back to a stop outside the product (the sentinel it started on, the fixture page) neither
  // left nor held the focus in the product, but the keyboard never got past the grid either. A popup walk ends
  // on a repeat by design, so it is not judged here.
  if (!opened && !walk.reachedEnd && !walk.leftDocument && !walk.trapped && !walk.exitRoute?.left && walk.productStops > 0) {
    findings.push({
      kind: 'tab-walk-incomplete',
      criteria: ['2.1.2'],
      severity: 'advisory',
      step: label(walk.presses),
      measured: { presses: walk.presses, productStops: walk.productStops },
      reason: `${key} never reached the other side of the grid: the walk came back to a stop outside it, so the keyboard cannot get past the grid this way`,
    });
  }
  if (walk.trapped && !(walk.modal && modalExit)) {
    const last = [...stops].reverse().find(isProductStop) ?? stops.at(-1);

    findings.push({
      kind: 'keyboard-trap',
      criteria: ['2.1.2'],
      severity: 'serious',
      selector: last?.locator ?? last?.region ?? 'unknown',
      step: label(walk.presses),
      measured: { direction, presses: walk.presses, cycleLength: walk.cycle ? walk.cycle.to - walk.cycle.from : null, modal: walk.modal },
      reason: walk.modal
        ? 'A modal dialog holds the focus and neither Escape nor a button in it lets the keyboard out'
        : `${direction === 'forward' ? 'Tab' : 'Shift+Tab'} never moved the focus out of the grid`,
    });
  }

  return findings;
}

/**
 * The findings of the Escape test on a popup state (a menu, an editor, the comment editor): Escape
 * must close it, pressed as many times as the popup has levels (a submenu takes two), and the focus
 * must come back to the grid, where it was when the popup opened.
 *
 * @param {object} input What the test saw.
 * @param {string} input.state The catalog state.
 * @param {number|null} input.closedAfter The press that closed the popup, or `null` when none did.
 * @param {number} [input.presses] How many presses were tried.
 * @param {boolean} input.focusReturned Whether the focus is back in the grid on the opener.
 * @param {string} [input.focus] Where the focus is instead.
 * @returns {object[]} The findings.
 */
export function escapeFindings({ state, closedAfter, presses = 3, focusReturned, focus = 'unknown' }) {
  if (closedAfter === null) {
    return [{
      kind: 'escape-does-not-close',
      criteria: ['2.1.2'],
      severity: 'serious',
      step: `Escape ${presses} times on the ${state} state`,
      measured: { presses },
      reason: 'Escape does not close the popup, so the keyboard cannot leave it the way the shortcut guide documents',
    }];
  }
  if (!focusReturned) {
    return [{
      kind: 'focus-not-returned',
      criteria: ['2.4.3'],
      severity: 'serious',
      step: `Escape on the ${state} state`,
      measured: { focus, presses: closedAfter },
      reason: 'After Escape closed the popup, the focus did not come back to the cell it was opened from',
    }];
  }

  return [];
}

/**
 * The stops of a walk as a golden keeps them: what a reviewer can read and what does not change
 * between runs (the region, the role, the name, the cell), and nothing that does (element refs).
 *
 * @param {object[]} stops The stops.
 * @returns {object[]} The golden stops.
 */
export function goldenStops(stops) {
  return stops.map((item) => {
    if (!isProductStop(item) && item.region !== 'outside') {
      return { region: item.region };
    }

    return { region: item.region, role: item.role ?? '', name: item.name ?? '', ...(item.cell ? { cell: item.cell } : {}) };
  });
}

/**
 * The first difference between a golden tab order and a walk's, or `null` when they are the same.
 *
 * @param {object[]} expected The golden stops.
 * @param {object[]} actual The walk's stops (`goldenStops()`).
 * @returns {{index: number, expected: object|null, actual: object|null, expectedLength: number, actualLength: number}|null} The difference.
 */
export function diffTabOrder(expected, actual) {
  const length = Math.max(expected.length, actual.length);

  for (let index = 0; index < length; index++) {
    if (JSON.stringify(expected[index] ?? null) !== JSON.stringify(actual[index] ?? null)) {
      return { index, expected: expected[index] ?? null, actual: actual[index] ?? null, expectedLength: expected.length, actualLength: actual.length };
    }
  }

  return null;
}

/**
 * The text of a shortcut cell of the docs page, as one line: the `<kbd>` tags, the bold marks and the
 * footnote marks gone, markdown escapes undone, and the keys of a chord joined by `+` with no spaces.
 *
 * @param {string} cell The cell's markdown.
 * @returns {string} The keys (`Ctrl+Shift+\ or Shift+F10`).
 */
export function normalizeKeys(cell) {
  return plainText(cell).replace(/\s*\+\s*/g, '+');
}

/**
 * Markdown cell text as plain text.
 *
 * @param {string} cell The cell.
 * @returns {string} The text.
 */
function plainText(cell) {
  return cell
    .replace(/<sup>.*?<\/sup>/g, '')
    .replace(/<\/?kbd>/g, '')
    .replace(/\*\*/g, '')
    .replace(/\\([\\*_`|])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Every shortcut row of the keyboard shortcuts guide
 * (`docs/content/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md`), with the section it is
 * under, its Windows keys, its macOS keys, its action, its ordinal among the rows of the same keys in
 * the same section (the row selection section lists Space three times), and its line.
 *
 * @param {string} markdown The page.
 * @returns {Array<{section: string, keys: string, mac: string, action: string, ordinal: number, line: number}>} The rows.
 */
export function parseShortcutTables(markdown) {
  const rows = [];
  const ordinals = new Map();
  let section = '';
  let inTable = false;

  markdown.split('\n').forEach((text, index) => {
    const heading = /^#{2,3}\s+(.+?)\s*$/.exec(text);

    if (heading) {
      section = plainText(heading[1].replace(/`/g, ''));
      inTable = false;

      return;
    }
    if (!text.startsWith('|')) {
      inTable = false;

      return;
    }
    if (!inTable) {
      // The first row of a table is its header.
      inTable = true;

      return;
    }
    if (/^\|\s*:?-{3,}/.test(text)) {
      return;
    }

    const cells = text.split(/(?<!\\)\|/).slice(1, -1).map(value => value.trim());
    const keys = normalizeKeys(cells[0] ?? '');

    if (!keys) {
      return;
    }

    const ordinal = (ordinals.get(`${section}|${keys}`) ?? 0) + 1;

    ordinals.set(`${section}|${keys}`, ordinal);
    rows.push({ section, keys, mac: normalizeKeys(cells[1] ?? ''), action: plainText(cells[2] ?? ''), ordinal, line: index + 1 });
  });

  return rows;
}

/**
 * The key that names a documented shortcut row: its section, its Windows keys and its ordinal.
 *
 * @param {{section: string, keys: string, ordinal?: number}} row The row or an inventory entry.
 * @returns {string} The key.
 */
export function shortcutKey(row) {
  return `${row.section}|${row.keys}|${row.ordinal ?? 1}`;
}

/**
 * The presses of a probe, each with the steps of its own: `press` is one key, a list of keys, or a list
 * that mixes keys and `{ key, prepare }`.
 *
 * @param {{press: string|Array<string|{key: string, prepare: Array<string|object>}>}} probe The probe.
 * @returns {Array<{key: string, prepare: Array<string|object>}>} The presses.
 */
export function probePresses(probe) {
  return (Array.isArray(probe.press) ? probe.press : [probe.press])
    .map(press => (typeof press === 'string' ? { key: press, prepare: [] } : { key: press.key, prepare: press.prepare ?? [] }));
}

/**
 * The step that names one press of a probe in its findings and problems: the documented keys, the key
 * pressed with the steps of its own (`after`), the steps after it (`then`), and where the focus starts.
 * A probe finding has a step and no selector, so the step is what tells two findings of a page apart: a
 * probe that presses one key twice from different steps of its own names them, or the two would share
 * an id.
 *
 * @param {{keys: string, probe: object}} entry The inventory entry.
 * @param {{key: string, prepare?: Array<string|object>}} press One press of `probePresses()`.
 * @returns {string} The step.
 */
export function probeStep({ keys, probe }, { key, prepare = [] }) {
  const own = prepare.map(stepText).join(', ');
  const then = (probe.then ?? []).map(stepText).join(', ');

  return `${keys} (${key}${own ? ` after ${own}` : ''}${then ? `, then ${then}` : ''}) on ${probe.setup}${probe.at ? ` at (${probe.at.join(', ')})` : ''}`;
}

/**
 * One prepare or `then` step of a probe, as words.
 *
 * @param {string|{api?: string, focus?: string, type?: string}} step The step.
 * @returns {string} The words.
 */
function stepText(step) {
  if (typeof step === 'string') {
    return step;
  }
  if (step.type !== undefined) {
    return `typing "${step.type}"`;
  }
  if (step.focus !== undefined) {
    return `focus on ${step.focus}`;
  }

  return step.api ?? JSON.stringify(step);
}

/**
 * What changed between two snapshots of the grid, as effect names: the selection moved or changed,
 * an editor opened or closed, a menu opened, closed or moved its highlight, the comment editor opened
 * or closed, the highlighted cell's comment changed, the data, the scroll, the sort, the merges, the frozen counts, the clipboard, the
 * collapsed groups, the filters, the highlight of an open editor's list or the rows a row selection holds
 * changed, the highlight or the checked values of the open column menu's Filter by value list changed,
 * a link opened, the text of the open editor or of the focused field changed, the open editor's caret
 * moved, the focus moved, the focus left the product.
 *
 * @param {object} before The snapshot before the key.
 * @param {object} after The snapshot after it.
 * @returns {string[]} The effects, sorted.
 */
export function effectsBetween(before, after) {
  const effects = new Set();
  const differs = field => JSON.stringify(before[field] ?? null) !== JSON.stringify(after[field] ?? null);

  if (differs('highlight')) {
    effects.add('selection-moves');
  }
  if (differs('ranges')) {
    effects.add('selection-changes');
  }
  if (!before.editorOpen && after.editorOpen) {
    effects.add('editor-opens');
  }
  if (before.editorOpen && !after.editorOpen) {
    effects.add('editor-closes');
  }

  // The editor's text, caret and list read null while it is closed, so they change only while it stays open:
  // a key that opens or closes the editor did that, it did not edit the text.
  const editing = before.editorOpen === true && after.editorOpen === true;

  if (editing && differs('editorText')) {
    effects.add('text-changes');
  }
  if (editing && differs('caret')) {
    effects.add('caret-moves');
  }
  if (editing && differs('listSelection')) {
    effects.add('list-moves');
  }

  // The Filter by value list of the open column menu reads null while the menu is closed, so a key that opens or closes
  // the menu did that: it moved no highlight in the list and ticked no value.
  const filtering = before.filterChecked != null && after.filterChecked != null;

  if (filtering && differs('filterList')) {
    effects.add('filter-list-moves');
  }
  if (filtering && differs('filterChecked')) {
    effects.add('filter-checked-changes');
  }
  if ((after.menus ?? 0) > (before.menus ?? 0)) {
    effects.add('menu-opens');
  }
  if ((after.menus ?? 0) < (before.menus ?? 0)) {
    effects.add('menu-closes');
  }
  if (before.menus > 0 && after.menus > 0 && differs('menuItem')) {
    effects.add('menu-moves');
  }
  if (!before.comment && after.comment) {
    effects.add('comment-opens');
  }
  if (before.comment && !after.comment) {
    effects.add('comment-closes');
  }
  // The comment of the highlighted cell: one that changed while the selection stayed is a comment saved.
  if (!differs('highlight') && differs('commentText')) {
    effects.add('comment-changes');
  }

  const fields = [['dataHash', 'value-changes'], ['scroll', 'scrolls'], ['sorting', 'sorts'], ['merged', 'merges'], ['frozen', 'freezes'],
    ['clipboard', 'clipboard'], ['links', 'link-opens'], ['collapsed', 'collapses'], ['filtered', 'filters'], ['rowSelection', 'row-selection-changes']];

  for (const [field, effect] of fields) {
    if (differs(field)) {
      effects.add(effect);
    }
  }
  if (JSON.stringify(before.active?.key ?? null) !== JSON.stringify(after.active?.key ?? null)) {
    effects.add('focus-moves');
  } else if (differs('focusedText')) {
    // The focused field's own text changed; a focus that moved into a field with text in it is a move.
    effects.add('text-changes');
  }
  if (PRODUCT.has(before.active?.region) && !PRODUCT.has(after.active?.region)) {
    effects.add('focus-leaves');
  }

  return [...effects].sort();
}

/**
 * The verdict of one documented shortcut: `ok` when it did what the guide says (or anything, for an
 * `any` probe), `nothing` when it changed nothing at all, `focus-left` when it moved the focus out of
 * the grid and the guide does not say it leaves, `unexpected` when it did something else or something
 * the guide rules out.
 *
 * @param {object} input The probe.
 * @param {string|string[]} input.expect The effect the guide describes, or several that each satisfy it.
 * @param {string[]} [input.forbid] Effects the key must not have (Escape on the comment editor must not save it).
 * @param {object} input.before The snapshot before the key.
 * @param {object} input.after The snapshot after it.
 * @returns {{status: 'ok'|'nothing'|'unexpected'|'focus-left', effects: string[]}} The verdict.
 */
export function probeVerdict({ expect, forbid = [], before, after }) {
  const effects = effectsBetween(before, after);
  const expected = Array.isArray(expect) ? expect : [expect];

  if (effects.length === 0) {
    return { status: 'nothing', effects };
  }
  if (effects.includes('focus-leaves') && !expected.includes('focus-leaves')) {
    return { status: 'focus-left', effects };
  }
  if (forbid.some(effect => effects.includes(effect))) {
    return { status: 'unexpected', effects };
  }
  if (expected.includes('any') || expected.some(effect => effects.includes(effect))) {
    return { status: 'ok', effects };
  }

  return { status: 'unexpected', effects };
}

/**
 * The line of each entry of the probe inventory (`a11y/checks/keyboard-shortcuts.mjs`), by its
 * `shortcutKey()`, so a probe's finding is annotated on its own entry. An entry starts on the line that
 * holds its `section:` and `keys:`; its `ordinal:`, when it has one, is on the same line.
 *
 * @param {string} source The inventory's text.
 * @returns {Map<string, number>} The 1-based lines.
 */
export function inventoryLines(source) {
  const lines = new Map();

  source.split('\n').forEach((line, index) => {
    const section = /section: '((?:[^'\\]|\\.)*)'/.exec(line);
    const keys = /keys: '((?:[^'\\]|\\.)*)'/.exec(line);

    if (section && keys) {
      const ordinal = /ordinal: (\d+)/.exec(line);
      const unescape = value => value.replace(/\\(.)/g, '$1');

      lines.set(shortcutKey({ section: unescape(section[1]), keys: unescape(keys[1]), ordinal: ordinal ? Number(ordinal[1]) : 1 }), index + 1);
    }
  });

  return lines;
}

/**
 * The documented shortcuts that are a single character key with no modifier: a letter, a digit, a
 * punctuation mark or a symbol (WCAG 2.1.4). Arrow glyphs name the arrow keys, not characters, and
 * `Space` is not a character key in 2.1.4's sense; `Alphanumeric keys` is typing into a cell, not a
 * shortcut. Each one found must be active only while the grid has the focus, which the walker proves.
 *
 * @param {Array<{section: string, keys: string}>} rows The documented rows (`parseShortcutTables()`).
 * @returns {Array<{section: string, keys: string}>} The single-character shortcuts.
 */
export function singleCharacterShortcuts(rows) {
  return rows.filter(row => row.keys.split(/ or | \/ /).some(key => [...key].length === 1 && !/[←-↓]/.test(key)));
}
