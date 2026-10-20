import type { HotInstance } from '../../../core/types';

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
 * Returns the transition the tab strip's motion runs with, in milliseconds, or `0` when the tabs
 * do not animate: the grid is not rendered, the user prefers reduced motion, or the theme
 * declares no transition. The reduced-motion check runs first, so motion that cannot run reads
 * no computed style.
 */
export function resolveSwitchTransition(hot: HotInstance): number {
  if (!hot.view || prefersReducedMotion(hot.rootWindow)) {
    return 0;
  }

  return resolveTransition(hot);
}
