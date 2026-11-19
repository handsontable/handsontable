/**
 * Prints the guide pages a pull request adds to the docs visual list, as comma-separated page ids
 * (`tests/AGENTS.md`, "A11y: the docs site scan"):
 *
 *   node tests/scripts/a11y-docs-new-pages.mjs --base <commit>
 *
 * A pull request's run of the docs site scan reads the staging deploy of develop, which has none of these
 * pages yet, so the scan skips them (`DOCS_A11Y_SKIP_PAGES`) and the summary names them. The list comes from
 * `docs/tests/paths.js` at the base commit against the one in the working tree.
 *
 * Nothing is printed when no page is new, and when the base cannot be read: the reason goes to stderr and the
 * exit status stays 0, so a failure here leaves every page scanned (a red page, as before) and never hides one.
 * `--repo <dir>` names the repository to read the base from (the working directory when absent).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { newGuidePageIds } from '../a11y/docs/pages.mjs';

const PATHS_FILE = 'docs/tests/paths.js';
const { values } = parseArgs({ options: { base: { type: 'string' }, repo: { type: 'string' } } });

if (!values.base) {
  console.error('name the base commit: --base <commit>');
  process.exit(2);
}

const folder = mkdtempSync(path.join(tmpdir(), 'docs-new-pages-'));

try {
  const source = execFileSync('git', ['-C', values.repo ?? process.cwd(), 'show', `${values.base}:${PATHS_FILE}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const file = path.join(folder, 'paths.cjs');

  writeFileSync(file, source);

  const lists = createRequire(import.meta.url)(file);
  const missing = ['jsPaths', 'reactPaths', 'angularPaths', 'vuePaths'].filter(key => !Array.isArray(lists[key]));

  // A list the base file lacks would read as a framework whose every page is new.
  if (missing.length > 0) {
    throw new Error(`the base file exports no list ${missing.join(', ')}`);
  }
  process.stdout.write(`${newGuidePageIds(lists).join(',')}\n`);
} catch (error) {
  console.error(`a11y-docs-new-pages: ${PATHS_FILE} at ${values.base} was not read, so no page is skipped: ${String(error.stderr || error.message).trim().split('\n')[0]}`);
} finally {
  rmSync(folder, { recursive: true, force: true });
}
