import { test } from 'node:test';
import assert from 'node:assert/strict';
import { job, jobIds, steps } from '../lib/workflow-text.mjs';

// The workflow tests share these readers, so a fix to how a workflow is split reaches all of them.

const WORKFLOW = `name: Sample

on:
  push:

jobs:
  first:
    runs-on: ubuntu-latest
    steps:
      - name: One
        run: echo one

      # A comment above the second step stays with the first.
      - uses: actions/checkout@v4
        with:
          clean: true
  second-job:
    needs: first
    steps:
      - run: echo two
`;

test('jobIds lists the jobs in order', () => {
  assert.deepEqual(jobIds(WORKFLOW), ['first', 'second-job']);
});

test('job returns one job\'s block, and an empty string for a job that does not exist', () => {
  assert.match(job(WORKFLOW, 'first'), /^first:\n {4}runs-on: ubuntu-latest$/m);
  assert.doesNotMatch(job(WORKFLOW, 'first'), /needs: first/);
  assert.match(job(WORKFLOW, 'second-job'), /needs: first/);
  assert.equal(job(WORKFLOW, 'missing'), '');
});

test('steps splits a job on the six-space dash, keeping a step\'s keys with it', () => {
  const firstSteps = steps(job(WORKFLOW, 'first'));

  assert.equal(firstSteps.length, 2);
  assert.match(firstSteps[0], /^- name: One$/m);
  assert.match(firstSteps[0], /# A comment above the second step stays with the first\./,
    'the comment block above a step belongs to the step before it');
  assert.match(firstSteps[1], /^- uses: actions\/checkout@v4$/m);
  assert.match(firstSteps[1], /^ {10}clean: true$/m);
  assert.deepEqual(steps(''), []);
});
