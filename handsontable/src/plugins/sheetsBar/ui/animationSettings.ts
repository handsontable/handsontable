import { isPlainObject } from '../../../helpers/object';
import type { TabStripMotion } from './tabStrip';

/**
 * The object form of the sheets bar's `animation` setting: one flag per motion of the tab strip.
 * A key left out keeps its motion on.
 */
export interface SheetsBarAnimationSettings {
  /**
   * The active tab marker's slide on a sheet switch.
   */
  switch?: boolean;
  /**
   * A new tab's entrance slide (a sheet added or duplicated).
   */
  add?: boolean;
  /**
   * A removed tab's exit and the slide of the tabs that close the gap it leaves.
   */
  remove?: boolean;
  /**
   * The slide of the tabs to their new places after a sheet moved from the tab menu or the API.
   */
  move?: boolean;
}

/**
 * One motion of the tab strip the `animation` setting can turn off.
 */
export type SheetsBarMotion = keyof SheetsBarAnimationSettings;

/**
 * The `animation` setting resolved to one flag per motion.
 */
export type ResolvedSheetsBarAnimation = Record<SheetsBarMotion, boolean>;

/**
 * Every motion the `animation` setting names, in the order the docs list them.
 */
const MOTIONS: readonly SheetsBarMotion[] = ['switch', 'add', 'remove', 'move'];

/**
 * Tells whether a key names a motion of the `animation` setting.
 */
function isMotion(key: string): key is SheetsBarMotion {
  return (MOTIONS as readonly string[]).includes(key);
}

/**
 * Tells whether a value is a valid `animation` setting: a boolean, or a plain object whose own
 * keys name motions and hold booleans.
 */
export function isValidAnimationSetting(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return true;
  }

  if (!isPlainObject(value)) {
    return false;
  }

  return Object.keys(value).every(key => isMotion(key) && typeof value[key] === 'boolean');
}

/**
 * Resolves an `animation` setting to one flag per motion. `false` turns every motion off, an
 * object turns off the motions it sets to `false`, and anything else keeps every motion on.
 */
export function resolveAnimationSetting(value: unknown): ResolvedSheetsBarAnimation {
  if (value === false) {
    return { switch: false, add: false, remove: false, move: false };
  }

  const flags = isPlainObject(value) ? value : {};

  return {
    switch: flags.switch !== false,
    add: flags.add !== false,
    remove: flags.remove !== false,
    move: flags.move !== false,
  };
}

/**
 * Keeps only the parts of a motion handed over between two tab strips whose key is still on: the
 * marker slide (`switch`), the tab entrances (`add`), the leaving copies (`remove`), and the tab
 * slide (the motion that started it, `remove` or `move`; a slide of unknown origin is kept). A
 * part that is dropped is never resumed, so the rebuilt strip shows its end state at once.
 */
export function keepAnimatedMotion(
  motion: TabStripMotion,
  animation: ResolvedSheetsBarAnimation,
  slideMotion: SheetsBarMotion | null,
): TabStripMotion {
  const keepSlide = slideMotion === null || animation[slideMotion];

  return {
    indicator: animation.switch ? motion.indicator : null,
    entering: animation.add ? motion.entering : [],
    slide: keepSlide ? motion.slide : null,
    leaving: animation.remove ? motion.leaving : [],
  };
}
