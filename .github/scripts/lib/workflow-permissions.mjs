/**
 * The token permission ceilings of reusable workflows, read as text.
 *
 * GitHub checks every job-level `permissions:` request of a called workflow, and of the workflows it calls in
 * turn, against the grant of the job that calls it, when the run starts, skipped jobs included. A request above
 * the grant fails the whole run before a job runs (`startup_failure`), and a pull request cannot show it when its
 * own caller declares no grant: `test.yml` on a pull request runs with the repository default token, while
 * `publish.yml`'s rc and stable test jobs call the same `test.yml` with a narrower set. `ceilingViolations()` walks
 * every caller that declares a grant and lists each nested request above it.
 */
import { job, jobIds } from './workflow-text.mjs';

const LEVELS = { none: 0, read: 1, write: 2 };
const LOCAL_CALL = /^ {4}uses: \.\/\.github\/workflows\/([\w.-]+\.ya?ml)\s*$/m;

/**
 * A workflow without its comments, trailing blanks and blank lines, so a key's block is a run of lines at one
 * indent. A `#` after a space starts a comment, as in YAML; a `#` inside a value without a space before it stays.
 *
 * @param {string} source A workflow file's contents.
 * @returns {string} The same keys, one per line.
 */
export function withoutComments(source) {
  return source
    .replace(/(^|\s)#.*$/gm, '$1')
    .replace(/[ \t]+$/gm, '')
    .replace(/^\n/gm, '');
}

/**
 * The `permissions:` a block declares at an indent: the workflow level (0) or a job's keys (4).
 *
 * @param {string} text The workflow, or one job's text from `job()`, without comments.
 * @param {number} indent The key's indent.
 * @returns {Record<string, string>|null} Scope to level (`*` for `read-all` and `write-all`), or `null` when the
 * block declares none and inherits its caller's.
 */
export function permissionsOf(text, indent) {
  const pad = ' '.repeat(indent);
  const inline = new RegExp(`^${pad}permissions: *(\\S.*)$`, 'm').exec(text);

  if (inline) {
    const value = inline[1].trim();

    if (value === '{}') {
      return {};
    }
    if (value === 'read-all' || value === 'write-all') {
      return { '*': value.slice(0, -4) };
    }

    throw new Error(`permissions: ${value} is a shape this reader does not know`);
  }

  const block = new RegExp(`^${pad}permissions:\\n((?:${pad} {2}\\S.*\\n?)+)`, 'm').exec(text);

  if (!block) {
    return null;
  }

  return Object.fromEntries(block[1].trim().split('\n').map((line) => {
    const [, scope, level] = /^\s*([a-z-]+): *(read|write|none)$/.exec(line) ?? [];

    if (!scope) {
      throw new Error(`permissions entry "${line.trim()}" is a shape this reader does not know`);
    }

    return [scope, level];
  }));
}

/**
 * The level a grant gives a scope.
 *
 * @param {Record<string, string>} grant Scope to level.
 * @param {string} scope The scope.
 * @returns {string} `none`, `read` or `write`.
 */
function levelOf(grant, scope) {
  return grant[scope] ?? grant['*'] ?? 'none';
}

/**
 * The requests of `asked` that `grant` does not cover.
 *
 * @param {Record<string, string>} asked What a job or a workflow asks for.
 * @param {Record<string, string>} grant What its caller grants.
 * @returns {string[]} One `scope: level (the caller grants level)` per request above the grant.
 */
function above(asked, grant) {
  const scopes = asked['*'] ? [...new Set([...Object.keys(grant), '*'])] : Object.keys(asked);

  return scopes
    .filter(scope => scope !== 'metadata' && LEVELS[levelOf(asked, scope)] > LEVELS[levelOf(grant, scope)])
    .map(scope => `${scope}: ${levelOf(asked, scope)} (the caller grants ${levelOf(grant, scope)})`);
}

/**
 * Every nested permission request above the grant of the caller that leads to it.
 *
 * @param {object} input The workflows.
 * @param {string[]} input.files The workflow file names under `.github/workflows/`.
 * @param {(file: string) => string} input.read Reads one by name.
 * @returns {{violations: string[], walked: string[]}} Each violation as `caller → … → file#job: scope: level (…)`,
 * and every `file#job` the walk judged, so a test can tell a clean walk from one that judged nothing.
 */
export function ceilingViolations({ files, read }) {
  const violations = [];
  const walked = [];
  const source = file => withoutComments(read(file));

  const walk = (file, grant, path) => {
    const workflow = source(file);
    const top = permissionsOf(workflow, 0);

    if (top) {
      for (const request of above(top, grant)) {
        violations.push(`${[...path, `${file} (workflow level)`].join(' → ')}: ${request}`);
      }
    }
    for (const id of jobIds(workflow)) {
      const body = job(workflow, id);
      const own = permissionsOf(body, 4);
      const [, called] = LOCAL_CALL.exec(body) ?? [];

      walked.push(`${file}#${id}`);
      if (own) {
        for (const request of above(own, grant)) {
          violations.push(`${[...path, `${file}#${id}`].join(' → ')}: ${request}`);
        }
      }
      if (called) {
        walk(called, own ?? top ?? grant, [...path, `${file}#${id}`]);
      }
    }
  };

  for (const file of files) {
    const workflow = source(file);
    const top = permissionsOf(workflow, 0);

    for (const id of jobIds(workflow)) {
      const body = job(workflow, id);
      const [, called] = LOCAL_CALL.exec(body) ?? [];
      // A caller with no grant of its own and none at the workflow level runs with the repository's default
      // token, which no file says: there is no ceiling to read.
      const grant = permissionsOf(body, 4) ?? top;

      if (called && grant) {
        walk(called, grant, [`${file}#${id}`]);
      }
    }
  }

  return { violations, walked };
}
