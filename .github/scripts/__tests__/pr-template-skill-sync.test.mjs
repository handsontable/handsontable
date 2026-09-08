import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The pr-creation skill carries a copy of the PR template so a body can be written without opening
// the template. A copy drifts: DEV-2063 added the machine-read `MANUAL QA NEEDED` line and two new
// sections to the template on 2026-09-03, and every PR opened through the skill for the next week
// lacked them. These tests fail the tooling suite the moment the two disagree again.
const root = repoRoot();
const template = readFileSync(path.join(root, '.github/PULL_REQUEST_TEMPLATE.md'), 'utf8');
const skill = readFileSync(path.join(root, '.claude/skills/pr-creation/SKILL.md'), 'utf8');

// A checklist line's HTML comment (the template's instructions) trails the text, so the text is
// whatever precedes the first `<!--`. Cut, not regex-stripped: this is a comparison of two documents
// the repository owns, not a sanitizer, and the comment never has to be removed from the middle.
const withoutComment = line => line.split('<!--')[0].trimEnd();
const checklistLines = text => text.split('\n')
  .filter(line => /^- \[[ xX]\] /.test(line))
  .map(line => withoutComment(line.replace(/^- \[[ xX]\] /, '- [ ] ')));

test('every heading of the PR template appears in the pr-creation skill', () => {
  const headings = template.match(/^### .*$/gm) ?? [];

  assert.ok(headings.length >= 6, 'the template lost its headings');

  for (const heading of headings) {
    assert.ok(skill.includes(heading), `${heading} is in .github/PULL_REQUEST_TEMPLATE.md but not in the pr-creation skill`);
  }
});

test('every checklist line of the PR template appears in the skill, whether ticked or not', () => {
  const skillLines = new Set(checklistLines(skill));

  for (const line of checklistLines(template)) {
    assert.ok(skillLines.has(line), `checklist line missing from the pr-creation skill: ${line}`);
  }
});

test('the MANUAL QA NEEDED line keeps the wording the Checks scope router reads', () => {
  const checks = readFileSync(path.join(root, '.github/workflows/checks.yml'), 'utf8');

  assert.match(checks, /MANUAL QA NEEDED/, 'checks.yml no longer reads the line; update this test with the new contract');
  assert.match(template, /^- \[ \] MANUAL QA NEEDED — /m);
  assert.match(skill, /^- \[ \] MANUAL QA NEEDED — /m, 'the skill must show the line unticked, ready to be ticked');
});
