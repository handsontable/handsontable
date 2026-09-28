import type { HotInstance } from '../../core/types';
import type { IconKey } from '../types';
import { ICON_CLASS, ICON_FLIP_RTL_CLASS, getIconClassName } from './utils/icons';

/**
 * Per-icon options for `createIcon`/`syncIcon`.
 */
export interface IconOptions {
  /**
   * Mirrors the glyph under `[dir="rtl"]` (directional arrows).
   */
  flipInRtl?: boolean;
  /**
   * Extra site-specific classes, e.g. a slot marker for `syncIcon`.
   */
  className?: string;
}

type IconHost = Pick<HotInstance, 'rootDocument' | 'themeManager'>;

/**
 * Nested Handsontable instances that draw their icons with another instance's theme, keyed by
 * the nested instance. Only a root instance gets a `ThemeManager` (`core.ts`), so a nested grid
 * such as the Filters by-value list would otherwise always take the plain-glyph fallback and
 * ignore the root's class-list or renderer mapping. Weak, so the link never keeps a destroyed
 * instance alive.
 */
const iconSources = new WeakMap<object, Pick<HotInstance, 'themeManager'>>();

/**
 * Makes a nested Handsontable instance draw its icons with another instance's theme mapping.
 * The source's `themeManager` is read on every call, so a later theme switch on the source is
 * followed. The nested instance's own `themeManager` still wins when it has one.
 *
 * @param {object} hot The nested instance.
 * @param {object} source The instance whose theme the nested one follows (usually the root).
 */
export function linkIconSource(hot: object, source: Pick<HotInstance, 'themeManager'>): void {
  iconSources.set(hot, source);
}

/**
 * Returns the theme manager an instance draws its icons with: its own, or the one of the
 * instance it was linked to through `linkIconSource()`.
 *
 * @param {object} hot The Handsontable instance.
 * @returns {object|null}
 */
function resolveThemeManager(hot: IconHost): HotInstance['themeManager'] {
  return hot.themeManager ?? iconSources.get(hot)?.themeManager ?? null;
}

/**
 * `syncIcon()` bound to one Handsontable instance. Injected into a plugin's UI classes, so they
 * keep their icon slots in step with the theme without depending on the theme engine.
 */
export type IconSlotSync = (
  container: HTMLElement,
  slotClass: string,
  name: IconKey | null,
  options?: IconOptions,
) => HTMLElement | null;

/**
 * Creates the `<i>` element for an icon slot. Delegates to the instance's `ThemeManager` so
 * class-list and renderer icons apply; falls back to plain glyph classes when the instance
 * has no theme manager (`useTheme(null)`).
 *
 * @param {object} hot The Handsontable instance (needs `rootDocument` and `themeManager`).
 * @param {string} name The icon slot name.
 * @param {object} [options] See `IconOptions`.
 * @returns {HTMLElement}
 */
export function createIcon(
  hot: IconHost,
  name: IconKey,
  options: IconOptions = {}
): HTMLElement {
  const themeManager = resolveThemeManager(hot);

  if (themeManager) {
    return themeManager.createIcon(name, options);
  }

  const element = hot.rootDocument.createElement('i');
  const classes = [ICON_CLASS, getIconClassName(name)];

  if (options.flipInRtl) {
    classes.push(ICON_FLIP_RTL_CLASS);
  }

  if (options.className) {
    classes.push(options.className);
  }

  element.className = classes.join(' ');
  element.setAttribute('aria-hidden', 'true');

  return element;
}

/**
 * Keeps exactly one icon in a slot of a container that is re-rendered by hooks: creates the
 * element when missing, keeps it when the name is unchanged, replaces it when the name
 * changed, removes it when `name` is `null`.
 *
 * @param {object} hot The Handsontable instance.
 * @param {HTMLElement} container The element that owns the slot.
 * @param {string} slotClass A class unique to the slot inside the container.
 * @param {string|null} name The icon to show, or `null` to clear the slot.
 * @param {object} [options] See `IconOptions`.
 * @returns {HTMLElement|null} The icon element, or `null` when the slot is empty.
 */
export function syncIcon(
  hot: IconHost,
  container: HTMLElement,
  slotClass: string,
  name: IconKey | null,
  options: IconOptions = {}
): HTMLElement | null {
  const existing = container.querySelector<HTMLElement>(`.${slotClass}`);

  if (name === null) {
    existing?.remove();

    return null;
  }

  if (existing && existing.classList.contains(getIconClassName(name))) {
    // A kept slot's classes are right, but the theme's mapping for this name (glyph vs. class
    // list vs. renderer) can still have changed since this element was built - a runtime `icons`
    // config change or theme switch. Re-applying on every draw would turn this cheap class check
    // into a full className rewrite per icon per draw (this runs on every header draw), so the
    // revision stamp lets a kept element skip the reapply until the mapping actually moved.
    const themeManager = resolveThemeManager(hot);
    const revision = themeManager?.getIconsRevision();

    if (revision !== undefined && existing.dataset.htIconsRevision !== String(revision)) {
      themeManager?.applyIcon(existing, name, {
        ...options,
        className: [options.className, slotClass].filter(Boolean).join(' '),
      });
      existing.dataset.htIconsRevision = String(revision);
    }

    return existing;
  }

  const icon = createIcon(hot, name, {
    ...options,
    className: [options.className, slotClass].filter(Boolean).join(' '),
  });

  const themeManager = resolveThemeManager(hot);

  if (themeManager) {
    icon.dataset.htIconsRevision = String(themeManager.getIconsRevision());
  }

  if (existing) {
    existing.replaceWith(icon);
  } else {
    container.appendChild(icon);
  }

  return icon;
}

/**
 * Returns a `syncIcon()` variant that remembers which containers it ever put an icon into, so a
 * call that clears a slot (`name` is `null`) on a container it never filled returns at once,
 * without a subtree query. Meant for a header hook that runs for every header on every draw and
 * clears its slot on most of them: the hidden-columns and hidden-rows carets (a default grid has
 * `indicators` off) and the sort arrow on unsorted columns.
 *
 * A container is only ever forgotten with the tracker itself, so an element that lost its icon
 * some other way still takes the query, which is safe.
 *
 * @returns {Function} A function with the `syncIcon()` signature.
 */
export function createTrackedIconSync(): typeof syncIcon {
  const filledContainers = new WeakSet<HTMLElement>();

  return (hot, container, slotClass, name, options = {}) => {
    if (name === null && !filledContainers.has(container)) {
      return null;
    }

    if (name !== null) {
      filledContainers.add(container);
    }

    return syncIcon(hot, container, slotClass, name, options);
  };
}
