import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DETERMINISM_SIGNALS } from '../score.mjs';
import { expectedSmellOf, missReason } from '../lib/counterexamples.mjs';

test('expectedSmellOf reads the smell a counterexample declares in its file name, in every tier\'s suffix', () => {
  assert.deepEqual(expectedSmellOf('escape-cancels-edit.set-timeout.spec.ts'), { smell: 'set-timeout' });
  assert.deepEqual(expectedSmellOf('escape-cancels-edit.fixed-frame-wait.spec.js'), { smell: 'fixed-frame-wait' });
  assert.deepEqual(expectedSmellOf('getParsedNumber.sleep-call.unit.ts'), { smell: 'sleep-call' });
  assert.deepEqual(expectedSmellOf('getParsedNumber.sleep-call.unit.js'), { smell: 'sleep-call' });
});

test('expectedSmellOf rejects a file that names no smell — a stray README is not a counterexample', () => {
  const notCounterexamples = [
    'README.md', 'escape-cancels-edit-set-timeout.spec.ts', 'escape-cancels-edit.spec.ts', '.eslintrc.cjs',
  ];

  for (const name of notCounterexamples) {
    const result = expectedSmellOf(name);

    assert.match(result.error, /does not name the smell/, name);
    assert.equal(result.smell, undefined, name);
  }
});

test('expectedSmellOf rejects a smell the scorer does not know, and lists the known ones', () => {
  const result = expectedSmellOf('escape-cancels-edit.busy-loop.spec.ts');

  assert.match(result.error, /"busy-loop", which the scorer does not know/);

  for (const smell of DETERMINISM_SIGNALS) {
    assert.ok(result.error.includes(smell), `${smell} is listed as known`);
  }

  assert.deepEqual(expectedSmellOf('x.busy-loop.spec.ts', ['busy-loop']), { smell: 'busy-loop' });
});

test('missReason is null only when the declared smell is the sole smell and the sole problem', () => {
  const caught = {
    verdict: 'suspect',
    determinismSmells: [{ type: 'set-timeout', count: 1 }],
    problems: [{ type: 'determinism-smells' }],
  };

  assert.equal(missReason(caught, 'set-timeout'), null);
});

test('missReason names a lost signal — including when the file is suspect for an unrelated reason', () => {
  const meaningful = { verdict: 'meaningful', determinismSmells: [], problems: [] };
  const hollow = { verdict: 'suspect', determinismSmells: [], problems: [{ type: 'hollow-tests' }] };
  const otherSmell = {
    verdict: 'suspect',
    determinismSmells: [{ type: 'sleep-call', count: 1 }],
    problems: [{ type: 'determinism-smells' }],
  };

  assert.match(missReason(meaningful, 'set-timeout'), /"set-timeout" smell was not detected \(verdict meaningful\)/);
  assert.match(missReason(hollow, 'set-timeout'), /"set-timeout" smell was not detected \(verdict suspect\)/);
  assert.match(missReason(otherSmell, 'set-timeout'), /not detected .*smells found: sleep-call/);
});

test('missReason rejects a fixture with a second smell or a second problem, which would mask losing the first', () => {
  const twoSmells = {
    verdict: 'suspect',
    determinismSmells: [{ type: 'set-timeout', count: 1 }, { type: 'sleep-call', count: 1 }],
    problems: [{ type: 'determinism-smells' }],
  };
  const alsoHollow = {
    verdict: 'suspect',
    determinismSmells: [{ type: 'set-timeout', count: 1 }],
    problems: [{ type: 'hollow-tests' }, { type: 'determinism-smells' }],
  };

  assert.match(missReason(twoSmells, 'set-timeout'), /more than its one smell: set-timeout, sleep-call/);
  assert.match(missReason(alsoHollow, 'set-timeout'), /problems besides the smell.*hollow-tests/);
});
