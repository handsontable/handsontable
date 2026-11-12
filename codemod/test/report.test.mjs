import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { unifiedDiff } from '../src/diff.mjs';
import { Report, renderConsole, renderMarkdown } from '../src/report.mjs';

/**
 * Build a report with a few entries across two rules and three files.
 *
 * @returns {Report} The report.
 */
function sampleReport() {
  const report = new Report();

  const a = { ruleId: '18.0.0/a', severity: 'changed', message: 'Renamed.', guideUrl: 'https://example.com/g#a' };

  report.add({
    ruleId: '18.0.0/b',
    severity: 'manual',
    file: 'src/z.ts',
    line: 4,
    message: 'Replace by hand.',
    guideUrl: 'https://example.com/g#b',
  });
  report.add({ ...a, file: 'src/b.css', line: 9 });
  report.add({ ...a, file: 'src/a.css', line: 2 });
  report.add({ ruleId: 'parse-error', severity: 'warning', file: 'src/bad.ts', message: 'Could not parse.' });

  return report;
}

describe('Report', () => {
  it('collapses identical entries', () => {
    const report = new Report();
    const entry = { ruleId: 'r', severity: 'changed', file: 'a.css', line: 1, message: 'm' };

    report.add(entry);
    report.add({ ...entry });
    report.add({ ...entry, line: 2 });

    assert.equal(report.entries.length, 2);
  });

  it('defaults line and guideUrl to null and counts by severity', () => {
    const report = sampleReport();

    assert.equal(report.entries.at(-1).line, null);
    assert.equal(report.entries.at(-1).guideUrl, null);
    assert.deepEqual(report.counts(), { changed: 2, manual: 1, warning: 1 });
    assert.ok(report.has('parse-error'));
    assert.ok(!report.has('nope'));
  });

  it('groups by rule in first-seen order and sorts entries by file and line', () => {
    const groups = sampleReport().byRule();

    assert.deepEqual(groups.map(group => group.ruleId), ['18.0.0/b', '18.0.0/a', 'parse-error']);
    assert.deepEqual(groups[1].entries.map(entry => entry.file), ['src/a.css', 'src/b.css']);
  });
});

describe('renderConsole', () => {
  it('returns an empty string for an empty report', () => {
    assert.equal(renderConsole(new Report()), '');
  });

  it('groups entries under their rule with locations, guide links, and a summary', () => {
    const text = renderConsole(sampleReport());

    assert.match(text, /^18\.0\.0\/b \(1 entry, manual\)$/m);
    assert.match(text, /^ {2}\[manual\] src\/z\.ts:4 {2}Replace by hand\.$/m);
    assert.match(text, /^18\.0\.0\/a \(2 entries, changed\)$/m);
    assert.match(text, /^ {2}Guide: https:\/\/example\.com\/g#a$/m);
    assert.match(text, /\[warning\] src\/bad\.ts {2}Could not parse\./);
    assert.match(text, /Summary: 2 changed, 1 manual, 1 warning\.\n$/);
  });
});

describe('renderMarkdown', () => {
  it('writes a checklist: rewrites are checked, work left to the user is not', () => {
    const text = renderMarkdown(sampleReport());

    assert.match(text, /^# Handsontable migration report$/m);
    assert.match(text, /^## 18\.0\.0\/a$/m);
    assert.match(text, /^- \[x\] `src\/a\.css:2`: Renamed\.$/m);
    assert.match(text, /^- \[ \] `src\/z\.ts:4`: Replace by hand\.$/m);
    assert.match(text, /^- \[ \] `src\/bad\.ts` \(warning\): Could not parse\.$/m);
    assert.match(text, /^Guide: https:\/\/example\.com\/g#b$/m);
  });

  it('says so when there is nothing to report', () => {
    assert.match(renderMarkdown(new Report()), /Nothing to report\./);
  });
});

describe('unifiedDiff', () => {
  it('produces a unified diff with a/ and b/ headers', () => {
    const diff = unifiedDiff('src/a.css', 'a {\n  x: 1;\n}\n', 'a {\n  x: 2;\n}\n');

    assert.match(diff, /^--- a\/src\/a\.css/m);
    assert.match(diff, /^\+\+\+ b\/src\/a\.css/m);
    assert.match(diff, /^- {2}x: 1;$/m);
    assert.match(diff, /^\+ {2}x: 2;$/m);
  });
});
