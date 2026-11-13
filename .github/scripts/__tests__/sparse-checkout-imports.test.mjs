import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { jobIds, job } from '../lib/workflow-text.mjs';

// A job with a sparse checkout has only the folders it lists (and, in cone mode, the files at the top of the
// repository), and no installed packages: it runs `node` on a script straight after setup-node. A script whose
// imports reach a file outside those folders, or a package, dies at load with ERR_MODULE_NOT_FOUND, and only on
// the runs that reach the job: the verdict job of the a11y workflows skips itself on a pull request, so no proof
// run of the change that broke it could see it. This pins the import closure of every script such a job runs.

const ROOT = repoRoot();
const WORKFLOWS = '.github/workflows';
const stripYamlComments = source => source.replace(/(^|\s)#.*$/gm, '$1');
// A static import or re-export at the top of a module: `import x from '…'`, `import { a,\n b } from '…'`,
// `import '…'`, `export * from '…'`. The clause before `from` holds names, braces, commas and `* as`, never a quote.
const STATIC_IMPORT = /^(?:import|export)\s+(?:[\w*{}\s,$]+?\s+from\s+)?['"]([^'"]+)['"]/gm;
const DYNAMIC_IMPORT = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
// A comment line, where a JSDoc type (`{import('./x.mjs').Y}`) is not a load.
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;

/**
 * The folders a job's sparse checkout lists, or `null` when the job checks out the whole repository.
 *
 * @param {string} body The job's text.
 * @returns {string[]|null} The folders, relative to the repository root.
 */
function sparsePaths(body) {
  const match = /^( +)sparse-checkout: \|\n((?:\1 {2}\S.*\n?)+)/m.exec(body);

  return match ? match[2].split('\n').map(line => line.trim().replace(/\/+$/, '')).filter(Boolean) : null;
}

/**
 * The scripts a job runs with `node`, relative to the repository root.
 *
 * @param {string} body The job's text.
 * @returns {string[]} The scripts.
 */
function nodeScripts(body) {
  return [...body.matchAll(/\bnode(?:\s+--[\w-]+(?:=\S+)?)*\s+((?:\.\/)?[\w./-]+\.m?js)\b/g)].map(([, script]) => path.normalize(script));
}

/**
 * The relative and package specifiers a module loads.
 *
 * @param {string} source The module's text.
 * @returns {string[]} The specifiers.
 */
function specifiers(source) {
  const code = source.split('\n').filter(line => !COMMENT_LINE.test(line)).join('\n');

  return [...source.matchAll(STATIC_IMPORT), ...code.matchAll(DYNAMIC_IMPORT)].map(([, specifier]) => specifier);
}

/**
 * Every file a script's imports reach that a sparse checkout of `folders` lacks, with the chain that reaches it.
 *
 * @param {string} script The script, relative to the repository root.
 * @param {string[]} folders The folders the checkout lists.
 * @returns {string[]} The problems, empty when the closure stays inside the folders.
 */
function outsideImports(script, folders) {
  const inside = file => !file.includes('/') || folders.some(folder => file.startsWith(`${folder}/`));
  const problems = [];
  const seen = new Set();
  const walk = (file, chain) => {
    if (seen.has(file)) {
      return;
    }
    seen.add(file);

    for (const specifier of specifiers(readFileSync(path.join(ROOT, file), 'utf8'))) {
      if (specifier.startsWith('node:')) {
        continue;
      }
      if (!specifier.startsWith('.')) {
        problems.push(`${[...chain, file].join(' → ')} imports the package "${specifier}", which the job never installs`);
        continue;
      }

      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));

      if (!existsSync(path.join(ROOT, target))) {
        problems.push(`${[...chain, file].join(' → ')} imports ${target}, which does not exist`);
      } else if (!inside(target)) {
        problems.push(`${[...chain, file].join(' → ')} imports ${target}, outside the checkout (${folders.join(', ')})`);
      } else {
        walk(target, [...chain, file]);
      }
    }
  };

  walk(script, []);

  return problems;
}

const sparseJobs = readdirSync(path.join(ROOT, WORKFLOWS)).filter(name => /\.ya?ml$/.test(name)).flatMap((name) => {
  const workflow = stripYamlComments(readFileSync(path.join(ROOT, WORKFLOWS, name), 'utf8'));

  return jobIds(workflow).map(id => ({ name, id, body: job(workflow, id) }))
    .filter(({ body }) => sparsePaths(body) !== null)
    .map(entry => ({ ...entry, folders: sparsePaths(entry.body), scripts: nodeScripts(entry.body) }));
});

test('the sparse jobs are found, and each runs a script its own checkout holds', () => {
  const ids = sparseJobs.map(({ name, id }) => `${name}#${id}`);

  // The verdict and the input guard of each a11y workflow: a reader that found none of them pins nothing.
  for (const name of ['a11y-nightly.yml', 'screenreader-nightly.yml', 'docs-a11y.yml', 'website-a11y.yml']) {
    assert.ok(ids.includes(`${name}#verdict`), `${WORKFLOWS}/${name}: its verdict job checks out tests/lib and tests/scripts only`);
  }
  for (const { name, id, folders, scripts } of sparseJobs) {
    for (const script of scripts) {
      assert.ok(folders.some(folder => script.startsWith(`${folder}/`)), `${WORKFLOWS}/${name}#${id} runs ${script}, outside its checkout`);
    }
  }
});

test('every script a sparse job runs imports only files its checkout holds, and no package', () => {
  const problems = sparseJobs.flatMap(({ name, id, folders, scripts }) => scripts
    .flatMap(script => outsideImports(script, folders).map(problem => `${WORKFLOWS}/${name}#${id}: ${problem}`)));

  assert.deepEqual(problems, [], 'a module such a script imports dies at load in CI (ERR_MODULE_NOT_FOUND): move the code it needs into a '
    + 'folder the job checks out, or add the folder to the job\'s sparse-checkout. See .ai/CI.md, "sparse checkout".');
});
