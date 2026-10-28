/**
 * Forced colors and reduced motion: the pure half.
 *
 * `a11y/checks/forced-colors-motion.spec.ts` watches `document.getAnimations()` frame by frame and
 * records every animation it sees (its kind, name, animated properties, duration, iterations, target,
 * and when it was first and last seen running), and it captures the grid's states in forced colors. The
 * verdicts are here: 2.3.3 Animation from Interactions (motion that still runs when the user asked for
 * reduced motion), 2.2.2 Pause, Stop, Hide (content that moves or blinks for more than five seconds on
 * its own), and the forced-colors support of 1.4.1, 1.4.11 and 2.4.7 (a state, a focus or an icon that
 * forced colors leaves invisible). Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

export const MOTION_CHECK = 'forced-colors-motion';
export const MOTION_CRITERIA = ['1.4.1', '2.2.2', '2.3.3'];
// What moves: position, size and transform. Opacity and color change what is shown, not where. Chromium
// reports a transition per longhand, and a shorthand's keyframes as its longhands (`background-position`
// as `background-position-x` and `-y`), so the longhands are listed with the shorthands.
const MOTION_PROPERTIES = new Set(['transform', 'translate', 'rotate', 'scale', 'offset-distance', 'scroll-position',
  'left', 'right', 'top', 'bottom', 'inset', 'inset-inline-start', 'inset-inline-end', 'inset-block-start', 'inset-block-end',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'inline-size', 'block-size', 'min-inline-size', 'min-block-size', 'max-inline-size', 'max-block-size',
  'margin', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom',
  'margin-inline-start', 'margin-inline-end', 'margin-block-start', 'margin-block-end',
  'padding', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
  'padding-inline-start', 'padding-inline-end', 'padding-block-start', 'padding-block-end',
  'background-position', 'background-position-x', 'background-position-y']);
// A duration a reduced-motion rule shrinks to (0.01ms is the common one) moves nothing a user can see.
const INSTANT_MS = 1;
// 2.2.2's limit.
const FIVE_SECONDS = 5000;

/**
 * Whether an animation moves something: it animates a position, a size or a transform, for longer than
 * an instant.
 *
 * @param {{properties: string[], duration: number}} animation The animation.
 * @returns {boolean} Whether it is motion.
 */
export function isMotion(animation) {
  return animation.duration > INSTANT_MS && animation.properties.some(property => MOTION_PROPERTIES.has(property));
}

/**
 * The 2.3.3 findings of an interaction: with `prefers-reduced-motion: reduce`, every motion animation it
 * started. Without the preference, motion is allowed and nothing is reported. 2.3.3 is a AAA criterion,
 * so a finding is `moderate`.
 *
 * @param {object} input What the spec saw.
 * @param {boolean} input.reducedMotion Whether the page was told the user prefers reduced motion.
 * @param {string} input.step The interaction.
 * @param {object[]} input.animations The animations seen.
 * @returns {object[]} The findings.
 */
export function motionFindings({ reducedMotion, step, animations }) {
  if (!reducedMotion) {
    return [];
  }

  return dedupe(animations.filter(isMotion)).map(animation => ({
    kind: 'motion-despite-reduced-motion',
    criteria: ['2.3.3'],
    severity: 'moderate',
    selector: animation.target,
    step,
    measured: { animation: animation.name, properties: animation.properties.join(' '), duration: animation.duration },
    reason: 'The user asked for reduced motion, and this still moves',
  }));
}

/**
 * The 2.2.2 findings of a state at rest: an animation still running at the end of the watch that ran from
 * its start, and repeats without end or lasts five seconds or more. Moving and blinking content both
 * count, so an opacity pulse is reported like a spinner. The record says how long it was seen.
 *
 * @param {object} input What the spec saw.
 * @param {number} input.windowMs How long the spec watched.
 * @param {object[]} input.animations The animations seen.
 * @returns {object[]} The findings.
 */
export function longRunningFindings({ windowMs, animations }) {
  return dedupe(animations.filter(animation => animation.running
    && animation.lastSeen - animation.firstSeen >= Math.min(windowMs, FIVE_SECONDS) - 100
    && (animation.iterations === Infinity || animation.duration * animation.iterations >= FIVE_SECONDS)))
    .map(animation => ({
      kind: 'moves-over-five-seconds',
      criteria: ['2.2.2'],
      severity: 'moderate',
      selector: animation.target,
      step: 'the state at rest, watched for five seconds',
      measured: { animation: animation.name, properties: animation.properties.join(' '), seen: Math.round(animation.lastSeen - animation.firstSeen) },
      reason: 'Content moves or blinks on its own for more than five seconds, with no way to pause it',
    }));
}

const FORCED = {
  focus: { kind: 'focus-lost-in-forced-colors', criteria: ['2.4.7', '1.4.1'], reason: 'In forced colors, nothing changes when the focus arrives' },
  selection: { kind: 'selection-lost-in-forced-colors', criteria: ['1.4.1', '1.4.11'], reason: 'In forced colors, a selected range looks like an unselected one' },
  menu: { kind: 'menu-highlight-lost-in-forced-colors', criteria: ['2.4.7', '1.4.1'], reason: 'In forced colors, the highlighted menu item looks like the others' },
  icon: { kind: 'icon-lost-in-forced-colors', criteria: ['1.4.11'], reason: 'In forced colors, the icon is not drawn' },
  gridlines: { kind: 'gridlines-lost-in-forced-colors', criteria: ['1.4.11'], reason: 'In forced colors, the lines between cells are not drawn' },
};

/**
 * The finding of a part forced colors leaves invisible: a focus, a selection or a menu highlight that
 * changes nothing on screen, or an icon or a grid line that draws nothing. Forced colors replaces the
 * theme's colors with the system's, so what the theme said with color alone is lost; this is the support
 * 1.4.1 needs from a grid a user with forced colors runs.
 *
 * @param {object} input The measurement.
 * @param {'focus'|'selection'|'menu'|'icon'|'gridlines'} input.part The part.
 * @param {string} input.selector The element.
 * @param {string} input.step How the state was reached.
 * @param {number} input.changed The pixels that changed (a state) or that stand out (a drawn part).
 * @returns {object[]} The findings.
 */
export function forcedColorsFindings({ part, selector, step, changed }) {
  if (changed > 0) {
    return [];
  }

  const { kind, criteria, reason } = FORCED[part];

  return [{ kind, criteria, severity: part === 'gridlines' ? 'moderate' : 'serious', selector, step, measured: { changed }, reason }];
}

/**
 * One record per animation name and target.
 *
 * @param {object[]} animations The animations.
 * @returns {object[]} The first of each.
 */
function dedupe(animations) {
  const seen = new Set();

  return animations.filter((animation) => {
    const key = `${animation.name}|${animation.target}`;

    if (seen.has(key)) {
      return false;
    }
    seen.add(key);

    return true;
  });
}
