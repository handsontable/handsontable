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

// The skill embeds the body template as one fenced block (```` markdown … ````, four backticks so the
// inner ```bash blocks nest). Compare against THAT block, not the whole skill prose, so a heading
// mentioned in passing elsewhere cannot stand in for one the body template dropped, duplicated, or
// reordered.
const bodyBlockMatch = skill.match(/````markdown\n([\s\S]*?)\n````/);

assert.ok(bodyBlockMatch, 'the pr-creation skill must embed the body template in a ````markdown block');
const skillBody = bodyBlockMatch[1];

const headings = text => text.match(/^### .*$/gm) ?? [];

// A checklist line's HTML comment (the template's instructions) trails the text, so the text is
// whatever precedes the first `<!--`. Cut, not regex-stripped: this is a comparison of two documents
// the repository owns, not a sanitizer, and the comment never has to be removed from the middle. Tick
// state is normalized away — the skill's copy may prefill boxes the template leaves blank.
const withoutComment = line => line.split('<!--')[0].trimEnd();
const checklistLines = text => text.split('\n')
  .filter(line => /^- \[[ xX]\] /.test(line))
  .map(line => withoutComment(line.replace(/^- \[[ xX]\] /, '- [ ] ')));

test('the skill body template mirrors the PR template headings, in order', () => {
  const templateHeadings = headings(template);

  assert.ok(templateHeadings.length >= 6, 'the template lost its headings');
  // deepEqual is order-preserving and two-directional: a stale, duplicated, reordered, or missing
  // heading on either side fails.
  assert.deepEqual(headings(skillBody), templateHeadings,
    'the pr-creation skill body template no longer mirrors .github/PULL_REQUEST_TEMPLATE.md headings');
});

test('the skill body template mirrors the PR template checklist, in order', () => {
  const templateChecklist = checklistLines(template);

  assert.ok(templateChecklist.length >= 4, 'the template lost its checklist');
  assert.deepEqual(checklistLines(skillBody), templateChecklist,
    'the pr-creation skill body template no longer mirrors .github/PULL_REQUEST_TEMPLATE.md checklist');
});

test('the MANUAL QA NEEDED line keeps the exact matcher the Checks scope router reads', () => {
  const checks = readFileSync(path.join(root, '.github/workflows/checks.yml'), 'utf8');

  // Pin the executable matcher itself, not the phrase: a comment mentioning "MANUAL QA NEEDED" must
  // not keep this green while the regex the router runs drifts.
  assert.ok(
    checks.includes(String.raw`/^\s*-\s*\[[xX]\]\s+MANUAL QA NEEDED/m.test(pr.body`),
    'checks.yml no longer runs the MANUAL QA NEEDED matcher this test pins; update both together',
  );
  // The template and the skill both carry the line UNTICKED, so the matcher stays dormant until a
  // human ticks it. The matcher requires `[xX]`; the unticked `[ ]` here must not match it.
  assert.match(template, /^- \[ \] MANUAL QA NEEDED — /m);
  assert.match(skillBody, /^- \[ \] MANUAL QA NEEDED — /m,
    'the skill body template must show the line unticked, ready to be ticked');
  assert.doesNotMatch('- [ ] MANUAL QA NEEDED — x', /^\s*-\s*\[[xX]\]\s+MANUAL QA NEEDED/m,
    'sanity: the matcher only fires on a ticked box');
});
