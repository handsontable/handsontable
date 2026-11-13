import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { diffArrays } from 'diff';
import { listFixtures, parseReport, runFixture, unmatchedEntries } from './helpers/fixtures.mjs';

const fixtures = await listFixtures();
const FAILURES = ['parse-error', 'transform-error'];

describe('fixture harness', () => {
  it('discovers fixtures', () => {
    assert.ok(fixtures.length > 0, 'no fixtures found under versions/*/__fixtures__');
  });

  it('gives every fixture an input and an output file', () => {
    for (const fixture of fixtures) {
      assert.ok(fixture.inputName, `${fixture.version}/${fixture.name} has no input.<ext>`);
      assert.ok(fixture.outputName, `${fixture.version}/${fixture.name} has no output.<ext>`);
    }
  });

  it('reads report.json as a subset list, or as an exact list', () => {
    assert.deepEqual(parseReport(null), { entries: [], exact: false });
    assert.deepEqual(parseReport('[{"ruleId":"a"}]'), { entries: [{ ruleId: 'a' }], exact: false });
    assert.deepEqual(parseReport('{"exact":true,"entries":[{"ruleId":"a"}]}'),
      { entries: [{ ruleId: 'a' }], exact: true });
    assert.deepEqual(parseReport('{"exact":true}'), { entries: [], exact: true });
  });

  it('matches report entries as a subset: each expectation needs its own actual entry', () => {
    const actual = [
      { ruleId: 'a', severity: 'changed', line: 1 },
      { ruleId: 'a', severity: 'changed', line: 2 },
      { ruleId: 'b', severity: 'manual', line: null },
    ];

    assert.deepEqual(unmatchedEntries([{ ruleId: 'a' }, { ruleId: 'b', severity: 'manual' }], actual), []);
    assert.deepEqual(unmatchedEntries([{ ruleId: 'a', line: 2 }], actual), []);
    assert.deepEqual(unmatchedEntries([{ ruleId: 'b' }, { ruleId: 'b' }], actual), [{ ruleId: 'b' }]);
    assert.deepEqual(unmatchedEntries([{ ruleId: 'a', line: 9 }], actual), [{ ruleId: 'a', line: 9 }]);
  });
});

/**
 * The input lines (one-based) that the report entries of a run name, as `line` or in `lines`.
 *
 * @param {object[]} entries Report entries.
 * @returns {Set<number>} The lines.
 */
function namedLines(entries) {
  const lines = new Set();

  for (const entry of entries) {
    [entry.line, ...(entry.lines ?? [])].filter(Number.isInteger).forEach(line => lines.add(line));
  }

  return lines;
}

/**
 * The one-based input lines inside the `<style>` blocks of a Vue file, tags excluded.
 *
 * @param {string[]} lines The lines of the file.
 * @returns {Set<number>} The lines of the blocks.
 */
function styleBlockLines(lines) {
  const inside = new Set();
  let open = false;

  lines.forEach((text, index) => {
    if (/<\/style>/.test(text)) {
      open = false;
    }

    if (open) {
      inside.add(index + 1);
    }

    if (/<style\b[^>]*>\s*$/.test(text)) {
      open = true;
    }
  });

  return inside;
}

/**
 * Compare a stylesheet input with its output line by line. A line the run changed must be one a report entry names,
 * and a line it added without removing one must be a TODO comment. In a Vue file only the removed lines of the
 * `<style>` blocks are held to this, because the printer of a script block reformats what it edits.
 *
 * @param {string} input The original text.
 * @param {string} output The migrated text.
 * @param {object[]} entries Report entries of the run.
 * @param {boolean} isVue Whether the file is a Vue component.
 * @returns {string[]} A description of every line that broke the rule.
 */
function untargetedStyleChanges(input, output, entries, isVue) {
  const before = input.split('\n');
  const named = namedLines(entries);
  const styles = isVue ? styleBlockLines(before) : null;
  const problems = [];
  let line = 1;
  let afterRemoval = false;

  for (const chunk of diffArrays(before, output.split('\n'))) {
    if (chunk.added) {
      if (!isVue && !afterRemoval) {
        chunk.value.filter(text => !/TODO\(handsontable-codemod/.test(text))
          .forEach(text => problems.push(`added line that is not a TODO comment: ${text}`));
      }
    } else if (chunk.removed) {
      for (let index = 0; index < chunk.value.length; index++) {
        const number = line + index;

        if ((!styles || styles.has(number)) && !named.has(number)) {
          problems.push(`line ${number} changed without a report entry: ${chunk.value[index]}`);
        }
      }

      line += chunk.count;
    } else {
      line += chunk.count;
    }

    afterRemoval = Boolean(chunk.removed);
  }

  return problems;
}

for (const fixture of fixtures) {
  describe(`fixture ${fixture.version}/${fixture.name}`, () => {
    if (/\.(css|scss|vue)$/.test(fixture.inputName ?? '')) {
      it('changes only lines that a report entry names, and adds only TODO comments', async() => {
        const result = await runFixture(fixture);
        const isVue = fixture.inputName.endsWith('.vue');

        assert.deepEqual(untargetedStyleChanges(result.input, result.output, result.entries, isVue), []);
      });
    }

    it('produces the expected output and report', async() => {
      const result = await runFixture(fixture);

      assert.deepEqual(result.entries.filter(entry => FAILURES.includes(entry.ruleId)), [],
        'no fixture may end in a parse-error or a transform-error');
      assert.equal(result.output, result.expected);
      assert.deepEqual(unmatchedEntries(result.expectedReport, result.entries), []);

      if (result.exactReport) {
        const actual = JSON.stringify(result.entries.map(entry => [entry.ruleId, entry.severity, entry.line]));

        assert.equal(result.entries.length, result.expectedReport.length,
          `the exact report has ${result.expectedReport.length} entries, the run gave ${actual}`);
      }

      if (result.expected === result.input) {
        assert.equal(result.changed, false, 'a negative fixture must not change');
      }
    });

    it('is idempotent: running the output again changes nothing', async() => {
      const result = await runFixture(fixture);

      assert.equal(result.rerun.changed, false);
      assert.equal(result.rerun.output, result.expected);
    });
  });
}
