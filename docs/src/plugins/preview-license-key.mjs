import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEST_LICENSE_KEY } from '../test-license-key.mjs';

/**
 * The text every copy of the internal test key carries. The build check looks for it.
 */
export const TEST_KEY_MARKER = 'HANDSONTABLE INTERNAL TEST KEY';

/**
 * The example modules `src/scripts/example-runner.ts` executes, the same set as its `import.meta.glob`
 * patterns: `example*.{js,jsx,ts}` anywhere under `content/`, and `example*.vue` in a `vue/` folder. A
 * `.tsx` example is shown only, and so is every other file under `content/` (the `content/data/` snippets
 * among them).
 */
const EXECUTED_EXAMPLE_ID = /\/content\/(?:.+\/)?(?:example[^/]*\.(?:js|jsx|ts)|vue\/example[^/]*\.vue)$/;

/**
 * One placeholder line of `docs/AGENTS.md`, 2.5, with its trailing comment:
 * - `// licenseKey: 'your-license-key', // get a key at ...` (JavaScript, TypeScript, Vue script; either quote)
 * - `// license: 'your-license-key', // get a key at ...` (Angular `HOT_GLOBAL_CONFIG`)
 * - `// licenseKey="your-license-key" // get a key at ...` (a JSX attribute)
 *
 * The Vue and HTML template form (`<!-- license-key="..." -->`) is not matched: no executed example uses
 * it, and a test fails when one does.
 */
const PLACEHOLDER_LINE = /^([ \t]*)\/\/ ?(licenseKey|license)(: ?|=)(['"])your-license-key\4(,?).*$/gm;

/**
 * Returns `true` when a Vite module id is an example module the example runner executes.
 *
 * A query id is another module: `?raw` exports the file text, and `?vue&type=...` is a block of an SFC
 * that `@vitejs/plugin-vue` compiled from the already rewritten source.
 *
 * @param {string} id The Vite module id.
 * @returns {boolean}
 */
export function isExecutedExampleId(id) {
  return !id.includes('?') && EXECUTED_EXAMPLE_ID.test(toPosix(id));
}

/**
 * Converts a path to forward slashes, the form Vite gives module ids in.
 *
 * @param {string} path A file path.
 * @returns {string}
 */
function toPosix(path) {
  return path.split('\\').join('/');
}

/**
 * Lists the executed examples that hold a placeholder line: the modules a build with the key must
 * rewrite.
 *
 * @param {string} contentDir The absolute path of `docs/content`.
 * @returns {string[]} Absolute file paths, with forward slashes.
 */
export function listExamplesWithPlaceholder(contentDir) {
  return listFiles(contentDir, () => true)
    .map(toPosix)
    .filter(path => isExecutedExampleId(path))
    .filter(path => new RegExp(PLACEHOLDER_LINE.source, 'm').test(readFileSync(path, 'utf8')));
}

/**
 * Replaces each license key placeholder line with a live option that holds the key. The trailing comment
 * goes, and the line count stays, so no source map is needed.
 *
 * The key is written with `JSON.stringify()`: it holds double quotes, which the file's own quote style
 * would break.
 *
 * @param {string} code The module source.
 * @param {string} key The license key.
 * @returns {string} The source with every placeholder replaced.
 */
export function injectLicenseKey(code, key) {
  const literal = JSON.stringify(key);

  return code.replace(PLACEHOLDER_LINE, (match, indent, name, separator, quote, comma) => (separator === '='
    ? `${indent}${name}={${literal}}`
    : `${indent}${name}: ${literal}${comma}`));
}

/**
 * Returns the key to inject, or `null`. A build opts in with `DOCS_TEST_LICENSE_KEY=true`, which the docs
 * staging workflow sets, and a production build (`BUILD_MODE=production`) never gets the key.
 *
 * @param {NodeJS.ProcessEnv} env The environment.
 * @returns {string | null}
 */
export function resolvePreviewLicenseKey(env) {
  if (env.DOCS_TEST_LICENSE_KEY !== 'true' || env.BUILD_MODE === 'production') {
    return null;
  }

  return TEST_LICENSE_KEY;
}

/**
 * The text files a build writes. Images and fonts are skipped.
 */
const TEXT_EXTENSIONS = new Set(['.html', '.md', '.txt', '.json', '.xml', '.js', '.mjs', '.css']);

/**
 * Lists the files under a directory.
 *
 * @param {string} dir An absolute directory path.
 * @param {(name: string) => boolean} accept Whether to list a file, by its name.
 * @returns {string[]} Absolute file paths.
 */
function listFiles(dir, accept) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return listFiles(path, accept);
    }

    return accept(entry.name) ? [path] : [];
  });
}

/**
 * Fails when the key reached build output it must not reach, or missed the output it must reach.
 *
 * - A page, its Markdown twin, and every other non-script file must never hold the key, so the code a page
 *   shows keeps the placeholder. Script chunks are trusted: the code a page shows is read from disk, never
 *   from a chunk.
 * - A build that injected the key must hold it in at least one script chunk. Otherwise the transform did
 *   not reach the example modules, and the build would ship lock screens.
 * - A build that injected nothing must not hold the key anywhere.
 *
 * @param {string} distDir The build output directory.
 * @param {{ injected: boolean }} options Whether this build injected the key into the example modules.
 */
export function checkKeyInOutput(distDir, { injected }) {
  const isScript = path => ['.js', '.mjs'].includes(extname(path));
  const holding = listFiles(distDir, name => TEXT_EXTENSIONS.has(extname(name)))
    .filter(path => readFileSync(path, 'utf8').includes(TEST_KEY_MARKER))
    .map(path => toPosix(relative(distDir, path)));
  const offenders = holding.filter(path => !(injected && isScript(path)));

  if (offenders.length > 0) {
    throw new Error(`The internal test license key reached build output it must not reach: ${offenders.join(', ')}. `
      + 'Only the executed example modules of a staging or preview build may hold it.');
  }

  if (injected && !holding.some(isScript)) {
    throw new Error('DOCS_TEST_LICENSE_KEY is on, but no script chunk holds the internal test license key. '
      + 'The transform in astro.config.mjs (resolveMonorepoPackages) no longer reaches the example modules.');
  }
}

/**
 * Fails when an executed example that holds a placeholder never went through the rewrite. A script chunk
 * that holds the key proves only that one example got it: if a framework's modules stop reaching the
 * transform (a Vite or plugin upgrade puts a query on their ids), every grid of that framework is locked
 * again while the other chunks still hold the key.
 *
 * @param {string[]} expected The examples that must be rewritten, from `listExamplesWithPlaceholder()`.
 * @param {Set<string>} rewritten The module ids the transform rewrote.
 */
export function checkEveryExampleRewritten(expected, rewritten) {
  const done = new Set([...rewritten].map(toPosix));
  const missing = expected.filter(path => !done.has(toPosix(path)));

  if (missing.length > 0) {
    throw new Error(`DOCS_TEST_LICENSE_KEY is on, but ${missing.length} executed examples never reached the `
      + `license key rewrite, so their grids show the lock screen: ${missing.slice(0, 10).join(', ')}`
      + `${missing.length > 10 ? ', ...' : ''}. Check the transform in astro.config.mjs (resolveMonorepoPackages).`);
  }
}

/**
 * Astro integration that checks where the key landed once the build is written. Register it last.
 *
 * @param {object} options The check's inputs.
 * @param {boolean} options.injected Whether this build injects the key.
 * @param {Set<string>} options.rewritten The module ids the transform rewrote, filled during the build.
 * @param {string} options.contentDir The absolute path of `docs/content`.
 * @returns {import('astro').AstroIntegration}
 */
export function previewLicenseKeyCheck({ injected, rewritten, contentDir }) {
  return {
    name: 'preview-license-key-check',
    hooks: {
      'astro:build:done': ({ dir }) => {
        if (injected) {
          checkEveryExampleRewritten(listExamplesWithPlaceholder(contentDir), rewritten);
        }

        checkKeyInOutput(fileURLToPath(dir), { injected });
      },
    },
  };
}
