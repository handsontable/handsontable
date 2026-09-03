/**
 * Pure helpers for verifying that a package's TypeScript declaration pointers name files
 * that actually exist in the tree it publishes.
 *
 * A `types`/`typings` field — or a `types` condition inside `exports` — that names a
 * missing file is invisible to every runtime check: the package installs, imports, and
 * bundles fine, and only a TypeScript consumer sees `TS7016`. `@handsontable/vue3` shipped
 * four consecutive releases in that state (DEV-2732), because the only wrapper gate in the
 * publish path compared embedded version strings.
 *
 * No filesystem access lives here, so the logic is unit-testable; the caller supplies an
 * `exists` predicate.
 */

/**
 * Collect every string leaf beneath a `types` condition.
 *
 * A `types` condition is usually a plain string, but it may itself hold a conditions object
 * (`{ import: './x.d.mts', require: './x.d.cts' }` — the shape publint recommends for the
 * dual-package masquerade) or an array of fallbacks. Every leaf is a target that has to
 * resolve, so returning early on a non-string would silently skip a real pointer.
 *
 * @param {unknown} node The current node beneath a `types` key.
 * @param {string} path Field path of the current node, for the error message.
 * @returns {{ field: string, target: string }[]} Every target the condition names.
 */
function collectTypesTargets(node, path) {
  if (typeof node === 'string') {
    return [{ field: path, target: node }];
  }

  if (node === null || node === undefined) {
    return [];
  }

  if (Array.isArray(node)) {
    return node.flatMap((entry, index) => collectTypesTargets(entry, `${path}[${index}]`));
  }

  if (typeof node !== 'object') {
    return [];
  }

  return Object.entries(node).flatMap(([key, value]) => collectTypesTargets(value, `${path}.${key}`));
}

/**
 * Walk an `exports` map and yield every `types` condition it declares, with the field path
 * that reached it.
 *
 * Conditional exports nest arbitrarily and a value may be a string, an object, an array of
 * fallbacks, or `null` (an explicitly blocked subpath).
 *
 * @param {unknown} node The current `exports` node.
 * @param {string} path Field path of the current node, for the error message.
 * @returns {{ field: string, target: string }[]} Every declared types target.
 */
function collectExportsTypes(node, path) {
  if (node === null || node === undefined) {
    return [];
  }

  if (Array.isArray(node)) {
    return node.flatMap((entry, index) => collectExportsTypes(entry, `${path}[${index}]`));
  }

  if (typeof node !== 'object') {
    return [];
  }

  return Object.entries(node).flatMap(([key, value]) => {
    if (key === 'types') {
      return collectTypesTargets(value, `${path}.types`);
    }

    // Subpath keys are bracketed and condition keys are dotted, so the field path reads
    // the way publint reports the same problem: `pkg.exports["."].import.types`.
    const childPath = key.startsWith('.') ? `${path}[${JSON.stringify(key)}]` : `${path}.${key}`;

    return collectExportsTypes(value, childPath);
  });
}

/**
 * Collect every declaration pointer a manifest declares.
 *
 * @param {object} packageJson A parsed `package.json`.
 * @returns {{ field: string, target: string }[]} Every declared types target.
 */
export function collectTypePointers(packageJson) {
  const pointers = [];

  for (const field of ['types', 'typings']) {
    if (typeof packageJson?.[field] === 'string') {
      pointers.push({ field: `pkg.${field}`, target: packageJson[field] });
    }
  }

  pointers.push(...collectExportsTypes(packageJson?.exports, 'pkg.exports'));

  return pointers;
}

/**
 * Which of a manifest's declaration pointers name a file that is not there?
 *
 * @param {object} packageJson A parsed `package.json`.
 * @param {(target: string) => boolean} exists Resolves a pointer target — relative to the
 * manifest's own directory — to whether that file is present.
 * @returns {{ field: string, target: string }[]} The broken pointers, in declaration order.
 */
export function findMissingTypePointers(packageJson, exists) {
  return collectTypePointers(packageJson).filter(({ target }) => !exists(target));
}
