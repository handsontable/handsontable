import { normalizeClassNames } from './dom/element';

/**
 * The class names a renderer appended to the stored `className` of a cell, by cell meta object.
 * A weak map, so a meta object the grid drops takes its record with it.
 */
const rendererClassNames = new WeakMap<object, string[]>();

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
 * Takes every class name of a `className` the user writes out of the record. A class name the user
 * writes is theirs, whether they typed it or read the rendered value back and wrote it again, so
 * it has to outlive a type change. A recorded class name the written value leaves out stays on the
 * record, and the replay still drops it.
 *
 * @param {object} meta The cell meta object.
 * @param {*} value The `className` value the user writes.
 */
export function adoptWrittenClassNames(meta: object, value: unknown): void {
  const recorded = rendererClassNames.get(meta);

  if (recorded === undefined) {
    return;
  }

  const written = typeof value === 'string' || Array.isArray(value) ? normalizeClassNames(value) : [];
  const remaining = recorded.filter(className => !written.includes(className));

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
