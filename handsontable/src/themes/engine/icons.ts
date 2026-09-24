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
  hot: Pick<HotInstance, 'rootDocument' | 'themeManager'>,
  name: IconKey,
  options: IconOptions = {}
): HTMLElement {
  if (hot.themeManager) {
    return hot.themeManager.createIcon(name, options);
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
  hot: Pick<HotInstance, 'rootDocument' | 'themeManager'>,
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
    const revision = hot.themeManager?.getIconsRevision();

    if (revision !== undefined && existing.dataset.htIconsRevision !== String(revision)) {
      hot.themeManager?.applyIcon(existing, name, {
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

  if (hot.themeManager) {
    icon.dataset.htIconsRevision = String(hot.themeManager.getIconsRevision());
  }

  if (existing) {
    existing.replaceWith(icon);
  } else {
    container.appendChild(icon);
  }

  return icon;
}
