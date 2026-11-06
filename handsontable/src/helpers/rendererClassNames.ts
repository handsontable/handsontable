import { normalizeClassNames } from './dom/element';

/**
 * The class names a renderer appended to the stored `className` of a cell, by cell meta object.
 * A weak map, so a meta object the grid drops takes its record with it.
 */
const rendererClassNames = new WeakMap<object, string[]>();

/**
 * The horizontal alignment classes. A renderer adds one of them when the cell has none, and the user
 * picks one from the Alignment menu or writes it, so which of the two owns it depends on the write.
 */
const ALIGNMENT_CLASS_NAMES = ['htLeft', 'htCenter', 'htRight', 'htJustify'];

/**
 * Records class names a renderer appended to the `className` stored on a cell meta object. They
 * are told apart from the classes the user wrote, so the replay of the user's meta after a cache
 * reset can leave them out. A name that is already on the record is not added again, because a
 * `cells()` function that sets `className` makes the renderer append the same names on every render.
 * The helper keeps the array it gets when the meta object has no record yet, so the caller passes
 * a fresh one.
 *
 * @param {object} meta The cell meta object the renderer wrote to.
 * @param {string[]} classNames The class names the renderer appended.
 */
export function recordRendererClassNames(meta: object, classNames: string[]): void {
  if (classNames.length === 0) {
    return;
  }

  const recorded = rendererClassNames.get(meta);

  if (recorded === undefined) {
    rendererClassNames.set(meta, classNames);

    return;
  }

  classNames.forEach((className) => {
    if (!recorded.includes(className)) {
      recorded.push(className);
    }
  });
}

/**
 * Forgets every class name recorded for a cell meta object. Called when the user removes
 * `className`, so nothing is left to strip.
 *
 * @param {object} meta The cell meta object.
 */
export function forgetRendererClassNames(meta: object): void {
  rendererClassNames.delete(meta);
}

/**
 * Takes the alignment classes of a `className` the user writes out of the record. The user reads
 * the rendered `className` back and writes it with a new alignment (the Alignment menu does), or
 * types `htRight` themselves, and that alignment is a choice that has to outlive a type change.
 * Any other recorded class name stays on the record, so a marker the renderer added (`htNumeric`)
 * is still dropped when the written value carries it along.
 *
 * @param {object} meta The cell meta object.
 * @param {*} value The `className` value the user writes.
 */
export function adoptWrittenAlignmentClassNames(meta: object, value: unknown): void {
  const recorded = rendererClassNames.get(meta);

  if (recorded === undefined) {
    return;
  }

  const written = typeof value === 'string' || Array.isArray(value) ? normalizeClassNames(value) : [];
  const remaining = recorded.filter(className => !(ALIGNMENT_CLASS_NAMES.includes(className) &&
    written.includes(className)));

  if (remaining.length === 0) {
    rendererClassNames.delete(meta);
  } else {
    rendererClassNames.set(meta, remaining);
  }
}

/**
 * Drops the class names a renderer appended from a `className` value. A value that is not a string,
 * or a meta object with no record, comes back unchanged.
 *
 * @param {object} meta The cell meta object the value was read from.
 * @param {*} value The stored `className` value.
 * @returns {*} The value without the recorded class names.
 */
export function stripRendererClassNames(meta: object, value: unknown): unknown {
  const recorded = rendererClassNames.get(meta);

  if (recorded === undefined || typeof value !== 'string') {
    return value;
  }

  return normalizeClassNames(value).filter(className => !recorded.includes(className)).join(' ');
}
