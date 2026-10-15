import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Directories (relative to the package root, with a trailing slash) whose default-exporting declarations get a
 * self-contained `.d.mts` instead of a re-export wrapper. Under `node16`/`nodenext` the `.js` sibling of a wrapper
 * is CommonJS, so `export { default } from './x.js'` types a default import as the whole module namespace
 * (DEV-3421). Do not widen this list without checking a `node16` default import of each file, and `attw`.
 */
export const SELF_CONTAINED_MTS_DIRS = ['themes/static/variables/', 'i18n/languages/'];

/**
 * Entry-point declarations (relative to the package root) whose default export is `Handsontable`. A wrapper would
 * type `import Handsontable from 'handsontable'` as the CommonJS module namespace under `node16`/`nodenext`
 * (DEV-3430), and a self-contained copy would declare `Handsontable` a second time, which splits its identity from
 * the one the `.d.ts` graph names (the Angular wrapper's declaration emit then fails with TS2883). Their `.d.mts`
 * therefore imports a named re-export from an entry shim (`toEntryShim()`), which is the same symbol.
 */
export const ENTRY_POINT_DECLARATIONS = ['index.d.ts', 'base.d.ts'];

/**
 * Suffix of the entry shim written next to each entry-point declaration.
 */
export const ENTRY_SHIM_SUFFIX = '.entry.d.ts';

/**
 * Replace every comment with spaces of the same length (newlines are kept), so a pattern run over the result
 * reports offsets that are valid in the original. A `//` only starts a comment at the start of a line or after
 * whitespace, which keeps `'http://...'` strings intact.
 *
 * @param {string} source The declaration source.
 * @returns {string} The source with comments blanked out.
 */
function maskComments(source) {
  const blank = comment => comment.replace(/[^\n]/g, ' ');

  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|\s)\/\/[^\n]*/g, (match, lead) => lead + blank(match.slice(lead.length)));
}

/**
 * Make the relative specifiers of a declaration valid under ESM resolution, where `./x` does not
 * resolve and `./dir` does not fall back to `./dir/index`. Covers `from '...'` (import, export,
 * `import type`, `export type { } from`, multiline lists) and `import('...')` types. Comments are ignored.
 *
 * The explicit specifier ends in `.mjs`, not `.js`. From a `.d.mts` file a `.js` specifier resolves to the
 * CommonJS-format `.d.ts`, so a default import through it would be typed as the module namespace again, while
 * `.mjs` resolves to the sibling `.d.mts` (every `.d.ts` has one). A default import of a file outside the
 * self-contained directories still gets the namespace, because that `.d.mts` is a thin wrapper: such an import
 * does not exist in the declarations today.
 *
 * A specifier with a trailing slash, and the bare `.` and `..`, are directories and go to their `index`.
 *
 * Only built-ins are imported here: this module runs on CI paths where the root install did not.
 *
 * @param {string} dtsContent The `.d.ts` source.
 * @param {string} dtsPath The absolute path of the `.d.ts` file the content comes from.
 * @returns {string} The source with explicit specifiers.
 * @throws {Error} When a relative specifier points at neither `<spec>.d.ts` nor `<spec>/index.d.ts`.
 */
export function toExplicitEsmSpecifiers(dtsContent, dtsPath) {
  const pattern = /(\bfrom\s+|\bimport\s*\()(['"])(\.{1,2}(?:\/[^'"]*)?)\2/g;
  const edits = [];

  for (const match of maskComments(dtsContent).matchAll(pattern)) {
    const [whole, lead, quote, spec] = match;

    if (!/\.m?js$/.test(spec)) {
      const isDirectory = spec === '.' || spec === '..' || spec.endsWith('/');
      const target = path.resolve(path.dirname(dtsPath), spec);
      let explicit;

      if (!isDirectory && existsSync(`${target}.d.ts`)) {
        explicit = `${spec}.mjs`;
      } else if (existsSync(path.join(target, 'index.d.ts'))) {
        explicit = `${spec.replace(/\/$/, '')}/index.mjs`;
      } else {
        throw new Error(
          `Cannot make "${spec}" explicit in ${dtsPath}: neither ${spec}.d.ts nor ${spec}/index.d.ts exists.`
        );
      }

      edits.push({ start: match.index, end: match.index + whole.length, text: `${lead}${quote}${explicit}${quote}` });
    }
  }

  return edits.reduceRight((out, { start, end, text }) => out.slice(0, start) + text + out.slice(end), dtsContent);
}

/**
 * Build the `.d.mts` content that goes next to a `.d.ts`. By default it is a thin wrapper that re-exports from the
 * `.js` sibling; a default-exporting declaration under `SELF_CONTAINED_MTS_DIRS` is a self-contained copy instead.
 *
 * @param {string} targetDir The composed package directory.
 * @param {string} dtsFile The `.d.ts` path relative to `targetDir`.
 * @returns {string} The `.d.mts` source.
 */
export function toMtsDeclaration(targetDir, dtsFile) {
  const dtsPath = path.resolve(targetDir, dtsFile);
  const dtsContent = readFileSync(dtsPath, 'utf8');
  const hasDefault = /\bexport\s+default\b/.test(dtsContent);
  const normalized = path.posix.normalize(dtsFile.split(path.sep).join('/'));

  if (hasDefault && ENTRY_POINT_DECLARATIONS.includes(normalized)) {
    const name = path.posix.basename(normalized, '.d.ts');

    const shim = `./${name}${ENTRY_SHIM_SUFFIX.replace(/\.d\.ts$/, '.js')}`;

    return `export * from './${name}.js';\nimport { Handsontable } from '${shim}';\nexport default Handsontable;\n`;
  }

  if (hasDefault && SELF_CONTAINED_MTS_DIRS.some(dir => normalized.startsWith(dir))) {
    return toExplicitEsmSpecifiers(dtsContent, dtsPath);
  }

  const jsRef = `./${path.basename(dtsFile, '.d.ts')}.js`;
  let mtsContent = `export * from '${jsRef}';\n`;

  if (hasDefault) {
    mtsContent += `export { default } from '${jsRef}';\n`;
  }

  return mtsContent;
}

/**
 * List the entry-point declarations that need an entry shim: the ones the composed package holds and that
 * default-export. A tree without them (a partial composition, a fixture) gets no shim, so the shim never
 * stands in for a declaration the package lacks.
 *
 * @param {string} targetDir The composed package directory.
 * @returns {string[]} The entry-point `.d.ts` paths relative to `targetDir`.
 */
export function listEntryShimTargets(targetDir) {
  return ENTRY_POINT_DECLARATIONS.filter((dtsFile) => {
    const dtsPath = path.resolve(targetDir, dtsFile);

    return existsSync(dtsPath) && /\bexport\s+default\b/.test(readFileSync(dtsPath, 'utf8'));
  });
}

/**
 * Build the entry shim that sits next to an entry-point declaration: a `.d.ts` that re-exports the default as the
 * named export `Handsontable`. A named import from a CommonJS module keeps every meaning of the symbol (value,
 * type, namespace) and its identity, which a default import under `node16` does not.
 *
 * @param {string} dtsFile The entry-point `.d.ts` path relative to the package root, e.g. `base.d.ts`.
 * @returns {string} The shim source.
 */
export function toEntryShim(dtsFile) {
  const name = path.posix.basename(dtsFile.split(path.sep).join('/'), '.d.ts');

  return `import Handsontable from './${name}';\nexport { Handsontable };\n`;
}
