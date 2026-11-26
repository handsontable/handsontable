import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { jobIds, job, steps } from '../lib/workflow-text.mjs';

// GitHub moves `ubuntu-latest` to a new Ubuntu release on its own schedule, over
// weeks, so a job on the floating label lands on either image during the
// rollout. The visual goldens are rendered on the runner itself, and a baseline
// seeded on one image and compared on the other fails at random. The image is
// therefore pinned to one label everywhere, and bumping it is a deliberate
// change (see `.ai/CI.md`).
//
// Caches are keyed on `runner.os`, which is `Linux` on every Ubuntu image.
// Playwright downloads Firefox and WebKit per distro release, so a cache saved on
// one image must not restore onto the next: every `actions/cache` step carries
// the image name in `key:` and in each `restore-keys:` entry, read from `$ImageOS`
// through a step output (the `env` context does not see runner variables).

const root = repoRoot();
const WORKFLOWS = path.join(root, '.github/workflows');
const ACTIONS = path.join(root, '.github/actions');
const IMAGE_OUTPUT = 'steps.runner-image.outputs.name';

const listYaml = directory => readdirSync(directory, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && /\.ya?ml$/.test(entry.name))
  .map(entry => path.join(entry.parentPath, entry.name));

const workflowFiles = listYaml(WORKFLOWS);
const actionFiles = listYaml(ACTIONS);
const files = [...workflowFiles, ...actionFiles];

const rel = file => path.relative(root, file);
const code = file => readFileSync(file, 'utf8').split('\n').filter(line => !line.trimStart().startsWith('#'));

// A check name that a branch rule requires must not change with the runner label, so a matrix `name:` may
// keep the old `ubuntu-latest` text. Only that exact shape is exempt, never a `runs-on` or an `os` value.
const REQUIRED_CHECK_NAME = /^\s+name:\s*ubuntu-latest\s+# required check name$/;

const IMAGE_EXCEPTIONS = [
  {
    file: '.github/workflows/docs-production.yml',
    job: 'docker',
    label: 'ubuntu-24.04',
    reason: 'Docker 29 on ubuntu-26.04 gets 401 Unauthorized pushing to the legacy docker.pkg.github.com registry',
  },
];

const runsOnLine = label => new RegExp(`^ {4}runs-on:\\s*${label.replace('.', '\\.')}\\s*$`);

const withoutExceptions = (relPath, source, exceptions = IMAGE_EXCEPTIONS) => exceptions
  .filter(exception => exception.file === relPath)
  .reduce((text, exception) => {
    const body = job(text, exception.job);
    const kept = body.split('\n').filter(line => !runsOnLine(exception.label).test(line)).join('\n');

    return body ? text.replace(body, () => kept) : text;
  }, source);

const pinnedCode = file => withoutExceptions(rel(file), readFileSync(file, 'utf8'))
  .split('\n')
  .filter(line => !line.trimStart().startsWith('#'));

// A composite action has no jobs; its steps sit at four spaces. Each unit is a
// block of steps that has to declare the runner image before it uses it.
const stepUnits = file => {
  const source = readFileSync(file, 'utf8');

  if (actionFiles.includes(file)) {
    return [{ where: rel(file), steps: source.split(/^ {4}(?=- )/m).filter(block => block.trim()) }];
  }

  return jobIds(source).map(id => ({ where: `${rel(file)} (${id})`, steps: steps(job(source, id)) }));
};

// The value lines of a `key:` or `restore-keys:`: the text after the colon, plus
// every deeper-indented continuation line of a block scalar.
const cacheKeyValues = stepText => {
  const lines = stepText.split('\n');
  const values = [];

  lines.forEach((line, index) => {
    const match = line.match(/^(\s*)(?:- )?(key|restore-keys):\s*(.*)$/);

    if (!match) return;

    const [, indent, , inline] = match;

    if (inline && !/^[|>][+-]?$/.test(inline)) values.push(inline);

    for (let next = index + 1; next < lines.length; next++) {
      const continuation = lines[next];

      if (!continuation.trim()) continue;
      if (continuation.search(/\S/) <= indent.length) break;

      values.push(continuation.trim());
    }
  });

  return values;
};

test('finds the workflow and action files to check', () => {
  assert.ok(workflowFiles.length > 20, `expected the workflow files, found ${workflowFiles.length}`);
  assert.ok(actionFiles.length > 0, 'expected the composite action files');
});

test('no workflow or action uses the floating ubuntu-latest label', () => {
  const offenders = files.filter(file => code(file).some(line => /\bubuntu-latest\b/.test(line) && !REQUIRED_CHECK_NAME.test(line))).map(rel);

  assert.deepEqual(offenders, [], 'pin the runner image, e.g. `ubuntu-26.04`; see .ai/CI.md');
});

test('every workflow and action uses one and the same Ubuntu image', () => {
  const labels = new Map();

  for (const file of files) {
    for (const line of pinnedCode(file)) {
      for (const [label] of line.matchAll(/\bubuntu-\d+\.\d+\b/g)) {
        labels.set(label, [...(labels.get(label) ?? []), rel(file)]);
      }
    }
  }

  const summary = [...labels].map(([label, where]) => `${label} in ${[...new Set(where)].join(', ')}`).join('; ');

  assert.equal(labels.size, 1, `a mix of images splits the goldens: ${summary}`);
});

test('every actions/cache step carries the runner image in key and restore-keys', () => {
  const offenders = [];

  for (const file of files) {
    for (const unit of stepUnits(file)) {
      for (const step of unit.steps.filter(block => /uses:\s*actions\/cache(\/\w+)?@/.test(block))) {
        const values = cacheKeyValues(step);

        if (!values.length || values.some(value => !value.includes(IMAGE_OUTPUT))) {
          offenders.push(unit.where);
        }
      }
    }
  }

  assert.deepEqual(offenders, [], `add \${{ ${IMAGE_OUTPUT} }} to every cache key and restore-keys entry`);
});

test('every use of the runner image output has its step declared earlier in the same job', () => {
  for (const file of files) {
    for (const unit of stepUnits(file)) {
      const text = unit.steps.join('\n');
      const used = text.indexOf(IMAGE_OUTPUT);

      if (used === -1) continue;

      const declared = text.indexOf('id: runner-image');

      assert.ok(declared !== -1 && declared < used, `${unit.where} uses the runner-image output without declaring the step first`);
    }
  }
});

test('every runner-image step reads $ImageOS into its output', () => {
  for (const file of files) {
    for (const unit of stepUnits(file)) {
      for (const step of unit.steps.filter(block => block.includes('id: runner-image'))) {
        assert.ok(step.includes('echo "name=$ImageOS" >> "$GITHUB_OUTPUT"'),
          `${unit.where}: the runner-image step must write $ImageOS to its output`);
      }
    }
  }
});

test('each image exception names a job that still runs on its own label', () => {
  for (const exception of IMAGE_EXCEPTIONS) {
    const body = job(readFileSync(path.join(root, exception.file), 'utf8'), exception.job);

    assert.ok(body, `${exception.file} has no job ${exception.job}`);
    assert.ok(body.split('\n').some(line => runsOnLine(exception.label).test(line)),
      `${exception.file} (${exception.job}) no longer runs on ${exception.label}; drop its exception`);
    assert.ok(exception.reason, `${exception.file} (${exception.job}) needs a reason`);
  }
});

test('an image exception exempts only the runs-on line of its own job', () => {
  const source = [
    'jobs:',
    '  docker:',
    '    runs-on: ubuntu-24.04',
    '    steps:',
    '      - run: echo ubuntu-24.04',
    '  other:',
    '    runs-on: ubuntu-24.04',
    '',
  ].join('\n');
  const exceptions = [{ file: 'wf.yml', job: 'docker', label: 'ubuntu-24.04', reason: 'test' }];

  assert.equal(withoutExceptions('wf.yml', source, exceptions), [
    'jobs:',
    '  docker:',
    '    steps:',
    '      - run: echo ubuntu-24.04',
    '  other:',
    '    runs-on: ubuntu-24.04',
    '',
  ].join('\n'));
  assert.equal(withoutExceptions('other.yml', source, exceptions), source);
});

test('an image exception keeps dollar sequences of its job text as written', () => {
  const exceptions = [{ file: 'wf.yml', job: 'docker', label: 'ubuntu-24.04', reason: 'test' }];
  const source = [
    'jobs:',
    '  docker:',
    '    runs-on: ubuntu-24.04',
    '    steps:',
    "      - run: grep -Eq '^[0-9]+$' && echo $& $$ $`",
    '  other:',
    '    runs-on: ubuntu-24.04',
    '',
  ].join('\n');

  assert.equal(withoutExceptions('wf.yml', source, exceptions), [
    'jobs:',
    '  docker:',
    '    steps:',
    "      - run: grep -Eq '^[0-9]+$' && echo $& $$ $`",
    '  other:',
    '    runs-on: ubuntu-24.04',
    '',
  ].join('\n'));
});
