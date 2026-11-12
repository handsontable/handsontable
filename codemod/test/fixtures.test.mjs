import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { listFixtures, runFixture, unmatchedEntries } from './helpers/fixtures.mjs';

const fixtures = await listFixtures();

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

for (const fixture of fixtures) {
  describe(`fixture ${fixture.version}/${fixture.name}`, () => {
    it('produces the expected output and report', async() => {
      const result = await runFixture(fixture);

      assert.equal(result.output, result.expected);
      assert.deepEqual(unmatchedEntries(result.expectedReport, result.entries), []);

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
