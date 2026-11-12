import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { unifiedDiff } from '../src/diff.mjs';
import { Report, SKIPPED_RULE_ID, formatLines, renderConsole, renderMarkdown, summaryLine } from '../src/report.mjs';

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
    assert.deepEqual(report.counts(), { changed: 2, manual: 1, warning: 1, marked: 0 });
    assert.ok(report.has('parse-error'));
    assert.ok(!report.has('nope'));
  });

  it('groups by rule, ordered by version and then by rule, and sorts entries by file and line', () => {
    const groups = sampleReport().byRule();

    assert.deepEqual(groups.map(group => group.ruleId), ['18.0.0/a', '18.0.0/b', 'parse-error']);
    assert.deepEqual(groups[0].entries.map(entry => entry.file), ['src/a.css', 'src/b.css']);
  });

  it('orders the versions numerically, so 18.10.0 follows 18.2.0', () => {
    const report = new Report();

    ['18.10.0/a', '18.2.0/z', '18.2.0/b', 'transform-error', '9.0.0/a'].forEach((ruleId) => {
      report.add({ ruleId, severity: 'manual', file: 'a.ts', message: 'm' });
    });

    assert.deepEqual(report.byRule().map(group => group.ruleId),
      ['9.0.0/a', '18.2.0/b', '18.2.0/z', '18.10.0/a', 'transform-error']);
  });

  it('keeps a note that holds for every file once, with the files it came from', () => {
    const report = new Report();
    const note = { ruleId: '18.0.0/n', severity: 'manual', message: 'CellValue is now unknown.', scope: 'run' };

    report.add({ ...note, file: 'src/b.ts', line: 3 });
    report.add({ ...note, file: 'src/a.ts', line: 7 });
    report.add({ ...note, file: 'src/a.ts', line: 9 });

    assert.equal(report.entries.length, 1);
    assert.deepEqual(report.entries[0].files, ['src/b.ts', 'src/a.ts']);
    assert.deepEqual(report.counts(), { changed: 0, manual: 1, warning: 0, marked: 0 });
    assert.deepEqual(report.byRule(), []);
    assert.equal(report.once().length, 1);
  });

  it('sets skipped files apart from the rule groups', () => {
    const report = new Report();

    report.add({ ruleId: SKIPPED_RULE_ID, severity: 'warning', file: 'b.less', message: 'Not analyzed.' });
    report.add({ ruleId: SKIPPED_RULE_ID, severity: 'warning', file: 'a.styl', message: 'Not analyzed.' });

    assert.deepEqual(report.byRule(), []);
    assert.deepEqual(report.skipped().map(entry => entry.file), ['a.styl', 'b.less']);
  });
});

describe('renderConsole', () => {
  it('prints only the summary for an empty report', () => {
    assert.equal(
      renderConsole(new Report()),
      'Summary: 0 files changed, 0 rewrites applied, 0 manual steps, 0 warnings.\n'
    );
  });

  it('groups entries under their rule with locations, guide links, and a summary', () => {
    const text = renderConsole(sampleReport(), { filesChanged: 2 });

    assert.match(text, /^18\.0\.0\/b \(1 manual\)$/m);
    assert.match(text, /^ {2}\[manual\] src\/z\.ts:4 {2}Replace by hand\.$/m);
    assert.match(text, /^18\.0\.0\/a \(2 changed\)$/m);
    assert.match(text, /^ {2}Guide: https:\/\/example\.com\/g#a$/m);
    assert.match(text, /\[warning\] src\/bad\.ts {2}Could not parse\./);
    assert.match(text, /Summary: 2 files changed, 2 rewrites applied, 1 manual step, 1 warning\.\n$/);
  });

  it('says would for a dry run', () => {
    assert.match(renderConsole(sampleReport(), { filesChanged: 1, dryRun: true }),
      /Summary: 1 file would change, 2 rewrites would be applied, 1 manual step, 1 warning\.\n$/);
  });

  it('lists ten locations of a rule, then the number of the others, and the markdown lists all', () => {
    const report = new Report();

    for (let line = 1; line <= 14; line += 1) {
      report.add({ ruleId: '18.0.0/many', severity: 'manual', file: 'src/a.ts', line, message: `Fix ${line}.` });
    }

    const text = renderConsole(report);

    assert.match(text, /^18\.0\.0\/many \(14 manual\)$/m);
    assert.match(text, /src\/a\.ts:10 {2}Fix 10\./);
    assert.doesNotMatch(text, /src\/a\.ts:11 /);
    assert.match(text, /^ {2}\+4 more \(use --report <file> for the full list\)$/m);
    assert.match(renderMarkdown(report), /^- \[ \] src\/a\.ts:14 Fix 14\.$/m);
  });
});

describe('formatLines', () => {
  it('sorts, drops duplicates, and writes a run of three or more lines as a range', () => {
    assert.equal(formatLines([14, 3, 9, 10, 11, 3, 20, 21]), '3, 9-11, 14, 20, 21');
    assert.equal(formatLines([5]), '5');
  });
});

describe('every location of a collapsed entry', () => {
  it('lists every line in the console and in the markdown', () => {
    const report = new Report();

    report.add({
      ruleId: '18.0.0/many',
      severity: 'manual',
      file: 'src/a.ts',
      line: 3,
      lines: [3, 9, 14, 15, 16],
      message: 'Check it. This part has 5 matches.',
    });

    const tail = 'Check it. This part has 5 matches. Lines: 3, 9, 14-16.';

    assert.ok(renderConsole(report).includes(`src/a.ts:3  ${tail}`));
    assert.ok(renderMarkdown(report).includes(`- [ ] src/a.ts:3 ${tail}`));
  });
});

describe('Read once and Skipped files sections', () => {
  const fill = () => {
    const report = new Report();

    ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts'].forEach((file) => {
      report.add({
        ruleId: '18.0.0/n',
        severity: 'manual',
        file,
        line: 1,
        message: 'It is unknown now.',
        scope: 'run',
      });
    });
    report.add({ ruleId: SKIPPED_RULE_ID, severity: 'warning', file: 'a.less', message: 'Not analyzed.' });

    return report;
  };

  it('prints the note once with the files in the console', () => {
    const text = renderConsole(fill());

    assert.equal(text.split('It is unknown now.').length - 1, 1);
    assert.ok(text.includes('Read once (1)\n'));
    assert.ok(text.includes('[manual] 18.0.0/n  It is unknown now. (4 files: src/a.ts, src/b.ts, src/c.ts, +1 more)'));
    assert.ok(text.includes('Skipped files (1)\n  a.less  Not analyzed.\n'));
  });

  it('prints every file in the markdown', () => {
    const text = renderMarkdown(fill());

    assert.ok(text.includes('## Read once\n'));
    assert.ok(text.includes('\n  - 4 files: src/a.ts, src/b.ts, src/c.ts, src/d.ts\n'));
    assert.ok(text.includes('## Skipped files\n'));
    assert.ok(text.includes('- [ ] a.less Not analyzed.\n'));
  });

  it('uses the same summary line in both reports', () => {
    const report = fill();
    const line = summaryLine(report, { filesChanged: 2, dryRun: true });

    assert.equal(line, 'Summary: 2 files would change, 0 rewrites would be applied, 1 manual step, 1 warning.');
    assert.ok(renderConsole(report, { filesChanged: 2, dryRun: true }).endsWith(`${line}\n`));
    assert.ok(renderMarkdown(report, { filesChanged: 2, dryRun: true }).includes(`\n${line}\n`));
  });
});

describe('renderMarkdown', () => {
  it('writes a checklist: rewrites are checked, work left to the user is not', () => {
    const text = renderMarkdown(sampleReport());

    assert.match(text, /^# Handsontable migration report$/m);
    assert.match(text, /^## 18\.0\.0\/a$/m);
    assert.match(text, /^Renamed\.\n\n- \[x\] src\/a\.css:2\n- \[x\] src\/b\.css:9\n/m);
    assert.equal(text.match(/Renamed\./g).length, 1);
    assert.match(text, /^- \[ \] src\/z\.ts:4 Replace by hand\.$/m);
    assert.match(text, /^- \[ \] src\/bad\.ts \(warning\) Could not parse\.$/m);
    assert.match(text, /^Guide: https:\/\/example\.com\/g#b$/m);
  });

  it('says so when there is nothing to report', () => {
    assert.match(renderMarkdown(new Report()), /Nothing to report\./);
  });

  it('puts the versions and the date in the title and the run notes first', () => {
    const report = new Report();

    report.notes.push('No migration for 19 is known. Migrated up to 18.1.0.');

    const text = renderMarkdown(report, { from: '17.1', to: '18.1.0', date: '2026-11-12' });

    assert.match(text,
      /^# Handsontable migration report: 17\.1 to 18\.1\.0 \(2026-11-12\)\n\nNo migration for 19 is known/);
    assert.match(renderConsole(report), /^No migration for 19 is known\. Migrated up to 18\.1\.0\.\n/);
  });

  it('prints the message of a rule once, in the console and in the Markdown', () => {
    const report = new Report();

    for (const file of ['a.ts', 'b.ts', 'c.ts']) {
      report.add({ ruleId: '18.0.0/n', severity: 'manual', file, line: 3, message: 'Same advice for all.' });
    }

    report.add({ ruleId: '18.0.0/n', severity: 'manual', file: 'd.ts', line: 1, message: 'Different advice.' });

    for (const text of [renderConsole(report), renderMarkdown(report)]) {
      assert.equal(text.match(/Same advice for all\./g).length, 1);
      assert.equal(text.match(/Different advice\./g).length, 1);
      assert.ok(text.includes('a.ts:3') && text.includes('b.ts:3') && text.includes('c.ts:3'));
    }
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
