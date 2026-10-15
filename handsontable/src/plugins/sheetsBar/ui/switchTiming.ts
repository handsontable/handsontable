import type { HotInstance } from '../../../core/types';

/**
 * The most cells a sheet switch animates. A switch with more visible cells than this skips the animation.
 */
export const MAX_ANIMATED_CELLS = 1500;

/**
 * The CSS custom property that carries the theme's base transition duration.
 */
const TRANSITION_PROPERTY = '--ht-table-transition';

/**
 * Matches a CSS `<time>` value in seconds or milliseconds.
 */
const CSS_TIME_PATTERN = /^(\d*\.?\d+)(ms|s)$/i;

/**
 * Converts a CSS `<time>` value (`0.15s`, `150ms`) to milliseconds. Empty or unreadable input
 * answers `0`.
 */
export function parseCssTime(value: string): number {
  const match = CSS_TIME_PATTERN.exec(value.trim());

  if (match === null) {
    return 0;
  }

  const amount = Number.parseFloat(match[1]);

  return match[2].toLowerCase() === 's' ? amount * 1000 : amount;
}

/**
 * The delay between two consecutive groups of a staggered entrance: half the transition, or less
 * when the groups would otherwise run past two transitions. A single group has no stagger.
 */
export function staggerStep(transitionMs: number, groupCount: number): number {
  if (groupCount <= 1) {
    return 0;
  }

  return Math.min(transitionMs / 2, (2 * transitionMs) / (groupCount - 1));
}

/**
 * The time the staggered content entrance takes from its first group's start to its last group's
 * end. It never exceeds three transitions.
 */
export function contentPhaseMs(transitionMs: number, groupCount: number): number {
  const count = Math.max(groupCount, 1);

  return transitionMs + ((count - 1) * staggerStep(transitionMs, count));
}

/**
 * The part of a column group's transition its leaving copies take to fade out, from its start.
 */
const SWAP_OUT_FACTOR = 0.45;

/**
 * The part of a column group's transition that passes before its arriving copies start to fade
 * in. It lies past the end of the leaving fade, so a cell never shows its old and its new text
 * at the same time.
 */
const SWAP_IN_START_FACTOR = 0.5;

/**
 * How long the leaving copies of a column group take to move up and fade out. They start with
 * the group.
 */
export function swapOutDurationMs(transitionMs: number): number {
  return transitionMs * SWAP_OUT_FACTOR;
}

/**
 * How long the arriving copies of a column group wait, after the group starts, before they rise
 * and fade in. The wait outlasts the leaving fade.
 */
export function swapInDelayMs(transitionMs: number): number {
  return transitionMs * SWAP_IN_START_FACTOR;
}

/**
 * How long the arriving copies of a column group take to rise and fade in. They end with the
 * group's transition, so the whole swap takes as long as it does without the wait.
 */
export function swapInDurationMs(transitionMs: number): number {
  return transitionMs - swapInDelayMs(transitionMs);
}

/**
 * The time the active tab marker takes to slide to the new tab, as a multiple of the transition.
 */
const PILL_FACTOR = 2.25;

/**
 * The time the tabs take to slide into their new places after a sheet moves, as a multiple of
 * the transition. It matches the marker slide, so a moved active tab carries its marker at the
 * pace a switch moves it.
 */
const TAB_SLIDE_FACTOR = PILL_FACTOR;

/**
 * The part of the reveal the selection marks wait before they fade in, so the header highlight
 * leads them.
 */
const REVEAL_MARK_DELAY_FACTOR = 1 / 3;

/**
 * The time the active tab marker takes to slide to the new tab.
 */
export function pillDurationMs(transitionMs: number): number {
  return transitionMs * PILL_FACTOR;
}

/**
 * The time the tabs take to slide from their old places to their new ones after a sheet moves.
 */
export function tabSlideDurationMs(transitionMs: number): number {
  return transitionMs * TAB_SLIDE_FACTOR;
}

/**
 * How long the selection marks wait, after the reveal starts, before they fade in.
 */
export function revealMarkDelayMs(transitionMs: number): number {
  return transitionMs * REVEAL_MARK_DELAY_FACTOR;
}

/**
 * How long the selection marks take to fade in. The fade ends with the reveal.
 */
export function revealMarkDurationMs(transitionMs: number): number {
  return transitionMs - revealMarkDelayMs(transitionMs);
}

/**
 * How far a tab's entrance has run, in milliseconds, or `null` once it is over. A clock that
 * reads earlier than the start counts as no time elapsed.
 */
export function entranceElapsedMs(startMs: number, nowMs: number, durationMs: number): number | null {
  const elapsed = Math.max(nowMs - startMs, 0);

  return elapsed < durationMs ? elapsed : null;
}

/**
 * Reads the theme's base transition duration from the grid's root element, in milliseconds.
 */
function resolveTransition(hot: HotInstance): number {
  const value = hot.rootWindow
    .getComputedStyle(hot.rootElement)
    .getPropertyValue(TRANSITION_PROPERTY);

  return parseCssTime(value);
}

/**
 * Tells whether the user asked the system to reduce motion. A window without `matchMedia`
 * answers `false`.
 */
function prefersReducedMotion(rootWindow: Window): boolean {
  if (typeof rootWindow.matchMedia !== 'function') {
    return false;
  }

  return rootWindow.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns the transition a sheet switch animates with, in milliseconds, or `0` when the switch
 * does not animate: the grid is not rendered, the user prefers reduced motion, or the theme
 * declares no transition. The reduced-motion check runs first, so a switch that cannot animate
 * reads no computed style.
 */
export function resolveSwitchTransition(hot: HotInstance): number {
  if (!hot.view || prefersReducedMotion(hot.rootWindow)) {
    return 0;
  }

  return resolveTransition(hot);
}
