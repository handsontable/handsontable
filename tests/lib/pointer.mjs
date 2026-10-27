/**
 * Pointer and drag alternatives: the pure half.
 *
 * `a11y/checks/pointer.spec.ts` presses every control the grid draws and moves the pointer away before
 * releasing it, and it performs every drag operation of `a11y/checks/drag-operations.mjs` together
 * with each alternative the inventory lists. The verdicts are here: 2.5.2 Pointer Cancellation (a
 * control that acts on the press, or completes after the pointer left it), 2.5.7 Dragging Movements (a
 * drag with no single-pointer alternative that does what it does), 2.1.1 Keyboard (a drag with no
 * keyboard alternative), and 2.5.1 Pointer Gestures (a path-based or multipoint gesture with no
 * single-pointer alternative). Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

export const POINTER_CHECK = 'pointer';
export const POINTER_CRITERIA = ['2.5.1', '2.5.2', '2.5.7'];
export const GESTURES = ['drag', 'path', 'multipoint'];
export const INPUTS = ['single-pointer', 'keyboard', 'pointer-modifier'];

// What a press does to the grid, from `effectsBetween()` of `lib/keyboard-walker.mjs` and the extra
// effects the pointer spec reads. A selection, a focus move, a hover highlight, a caret or a scroll is
// not an action: a press on a cell selects it by design, and a pointer over a menu item highlights it.
const NOT_ACTIONS = new Set(['selection-moves', 'selection-changes', 'focus-moves', 'focus-leaves', 'caret-moves', 'scrolls', 'list-moves',
  'menu-moves']);
// An action that only shows a popup: Escape takes it back, which is the undo 2.5.2 allows, so a person
// decides whether the press is acceptable.
const POPUP_EFFECTS = new Set(['menu-opens', 'editor-opens', 'comment-opens', 'popup-opens']);
const OPENING = new Set(['text-changes', 'state-changes']);

/**
 * The effects that are actions.
 *
 * @param {string[]} effects The effects between two snapshots.
 * @returns {string[]} The actions, sorted.
 */
export function actionEffects(effects) {
  return effects.filter(effect => !NOT_ACTIONS.has(effect)).sort();
}

/**
 * Names an element for a reader: its selector, and its accessible name when it has one.
 *
 * @param {{selector: string, name?: string}} target The target.
 * @returns {string} The label.
 */
function label(target) {
  return target.name ? `${target.selector} "${target.name}"` : target.selector;
}

/**
 * The 2.5.2 findings of one control: what the press did with the pointer still on it (`onPress`), what
 * releasing it after moving away did (`afterAway`), and what a plain click does (`onClick`, the positive
 * control). A control that acts on the press is `activates-on-press` (advisory when all it does is show
 * a popup); one that does what its click does after the pointer left it is `completes-after-pointer-left`.
 * A control whose click does nothing the snapshot sees is not measured.
 *
 * @param {object} input The measurement.
 * @param {{selector: string, name?: string}} input.target The control.
 * @param {string[]} input.onPress Effects of the press.
 * @param {string[]} input.afterAway Effects once the pointer was released away from the control.
 * @param {string[]} input.onClick Effects of a click on a fresh page.
 * @returns {{findings: object[], measured: boolean}} The findings, and whether the control was measured.
 */
export function cancellationFindings({ target, onPress, afterAway, onClick }) {
  const pressed = actionEffects(onPress);
  const clicked = actionEffects(onClick);
  // Releasing away counts only for what the control's own click does: a menu that closes when the
  // pointer is released outside it has been cancelled, which is what 2.5.2 asks for.
  const away = actionEffects(afterAway).filter(effect => !pressed.includes(effect) && clicked.includes(effect));
  const measured = clicked.length > 0 || pressed.length > 0;
  const selector = label(target);

  if (pressed.length > 0) {
    // Opening a popup reads its text and flips `aria-expanded`: those come with the opening.
    const popupOnly = pressed.some(effect => POPUP_EFFECTS.has(effect)) && pressed.every(effect => POPUP_EFFECTS.has(effect) || OPENING.has(effect));

    return {
      measured,
      findings: [{
        kind: 'activates-on-press',
        criteria: ['2.5.2'],
        severity: popupOnly ? 'advisory' : 'serious',
        selector,
        step: 'mouse down on the control, nothing else',
        measured: { effects: pressed.join(' ') },
        reason: popupOnly
          ? 'The press alone opens a popup; Escape closes it, so a person decides whether that is the undo 2.5.2 allows'
          : 'The press alone acts, before the pointer is released, so the user cannot cancel it by moving away',
      }],
    };
  }
  if (away.length > 0) {
    return {
      measured,
      findings: [{
        kind: 'completes-after-pointer-left',
        criteria: ['2.5.2'],
        severity: 'serious',
        selector,
        step: 'mouse down on the control, move away, mouse up',
        measured: { effects: away.join(' ') },
        reason: 'Releasing the pointer away from the control still acts, so moving away does not cancel it',
      }],
    };
  }

  return { findings: [], measured };
}

/**
 * The findings of one drag operation, from which of its alternatives the spec proved (`proven[i]` for
 * `operation.alternatives[i]`). 2.5.7 needs a single-pointer alternative that does all the drag does
 * (`covers: 'full'`); 2.1.1 needs a keyboard one. A pointer press with a key held is neither. An
 * alternative the inventory lists and the spec could not prove is `alternative-does-not-work`.
 *
 * @param {object} input The operation and the proof.
 * @param {object} input.operation The inventory entry.
 * @param {boolean[]} input.proven Whether each alternative did what the drag does.
 * @returns {object[]} The findings.
 */
export function dragFindings({ operation, proven }) {
  if (operation.gesture !== 'drag') {
    return [];
  }

  const findings = [];
  const works = (input, covers) => operation.alternatives.some((alternative, index) => alternative.input === input && proven[index]
    && (!covers || alternative.covers === covers));
  const base = { selector: operation.id, step: operation.operation };

  if (!works('single-pointer', 'full')) {
    const partial = works('single-pointer');

    findings.push({
      ...base,
      kind: 'drag-without-single-pointer-alternative',
      criteria: ['2.5.7'],
      severity: 'serious',
      measured: { plugin: operation.plugin, alternatives: operation.alternatives.map(item => item.input).join(' ') || 'none' },
      reason: partial
        ? 'A single pointer without dragging does only part of what the drag does'
        : 'Nothing but a drag does this with a pointer',
    });
  }
  if (!works('keyboard')) {
    findings.push({
      ...base,
      kind: 'drag-without-keyboard-alternative',
      criteria: ['2.1.1'],
      severity: 'serious',
      measured: { plugin: operation.plugin },
      reason: 'Nothing on the keyboard does what this drag does',
    });
  }
  operation.alternatives.forEach((alternative, index) => {
    if (!proven[index]) {
      findings.push({
        ...base,
        kind: 'alternative-does-not-work',
        criteria: [alternative.input === 'keyboard' ? '2.1.1' : '2.5.7'],
        severity: 'serious',
        step: alternative.how,
        measured: { input: alternative.input },
        reason: 'The alternative the inventory lists did not do what the drag does',
      });
    }
  });

  return findings;
}

/**
 * The 2.5.1 findings of a path-based or multipoint gesture: one with no proven single-pointer
 * alternative. A drag is free-form, so it is judged by 2.5.7, not here.
 *
 * @param {object} input The operation and the proof.
 * @param {object} input.operation The inventory entry.
 * @param {boolean[]} input.proven Whether each alternative did what the gesture does.
 * @returns {object[]} The findings.
 */
export function gestureFindings({ operation, proven }) {
  if (operation.gesture === 'drag') {
    return [];
  }

  const works = operation.alternatives.some((alternative, index) => alternative.input === 'single-pointer' && alternative.covers === 'full' && proven[index]);

  return works ? [] : [{
    kind: 'gesture-without-single-pointer-alternative',
    criteria: ['2.5.1'],
    severity: 'serious',
    selector: operation.id,
    step: operation.operation,
    measured: { gesture: operation.gesture, plugin: operation.plugin },
    reason: `A ${operation.gesture === 'path' ? 'path-based' : 'multipoint'} gesture has no single-pointer alternative`,
  }];
}

/**
 * What is wrong with the inventory, one line each: an unknown gesture or input, an id used twice, an
 * alternative without its `how` or `covers`.
 *
 * @param {object[]} inventory The inventory.
 * @returns {string[]} The problems.
 */
export function inventoryProblems(inventory) {
  const problems = [];
  const ids = new Set();

  for (const entry of inventory) {
    if (!GESTURES.includes(entry.gesture)) {
      problems.push(`${entry.id}: gesture "${entry.gesture}" is not one of ${GESTURES.join(', ')}`);
    }
    if (ids.has(entry.id)) {
      problems.push(`${entry.id}: an id is used twice`);
    }
    ids.add(entry.id);
    for (const key of ['plugin', 'operation', 'expect']) {
      if (!entry[key]) {
        problems.push(`${entry.id}: no ${key}`);
      }
    }
    if (!entry.page === !entry.fixture) {
      problems.push(`${entry.id}: names a catalog page or a fixture, not both`);
    }
    (entry.alternatives ?? []).forEach((alternative, index) => {
      if (!INPUTS.includes(alternative.input)) {
        problems.push(`${entry.id}: alternative ${index + 1} has input "${alternative.input}", not one of ${INPUTS.join(', ')}`);
      }
      if (!['full', 'partial'].includes(alternative.covers) || !alternative.how) {
        problems.push(`${entry.id}: alternative ${index + 1} needs \`how\` and \`covers\` (full or partial)`);
      }
    });
  }

  return problems;
}

/**
 * Which plugins follow the pointer (listen to its moves) and are neither in the inventory nor given a
 * reason in `notDrag`, and which reasons name a plugin that follows the pointer no more.
 *
 * @param {object} input The plugins and the lists.
 * @param {string[]} input.tracking The plugin folders whose source listens to pointer or touch moves.
 * @param {object[]} input.inventory The inventory.
 * @param {Record<string, string>} input.notDrag Plugin to the reason it is not a drag operation.
 * @returns {{missing: string[], stale: string[]}} The gaps.
 */
export function undeclaredPointerPlugins({ tracking, inventory, notDrag }) {
  const declared = new Set(inventory.map(entry => entry.plugin));

  return {
    missing: tracking.filter(plugin => !declared.has(plugin) && !notDrag[plugin]).sort(),
    stale: Object.keys(notDrag).filter(plugin => !tracking.includes(plugin)).sort(),
  };
}
