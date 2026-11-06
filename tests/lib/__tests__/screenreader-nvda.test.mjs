import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODE_TOGGLES, ensureNvdaMode, inferredModeNote, lastNvdaMode } from '../screenreader-nvda.mjs';

/**
 * A toggle that says the phrases in order, one per press, and counts the presses.
 *
 * @param {string[]} phrases What NVDA says on each press ('' for a silent one).
 * @returns {{toggle: () => Promise<string>, presses: () => number}} The toggle.
 */
function toggles(phrases) {
  let pressed = 0;

  return {
    toggle: async() => {
      const phrase = phrases[pressed] ?? '';

      pressed += 1;

      return phrase;
    },
    presses: () => pressed,
  };
}

test('lastNvdaMode takes the last mode phrase, inside one phrase too', () => {
  assert.equal(lastNvdaMode(['focus mode', 'browse mode']), 'browse');
  assert.equal(lastNvdaMode(['Focus mode. Browse mode']), 'browse');
  assert.equal(lastNvdaMode(['table with 4 rows']), null);
  assert.equal(lastNvdaMode([]), null);
});

test('a reader already in the wanted mode does not toggle', async() => {
  const { toggle, presses } = toggles([]);

  assert.deepEqual(await ensureNvdaMode({ mode: 'browse', wanted: 'browse', toggle }), { mode: 'browse', said: [] });
  assert.equal(presses(), 0);
});

test('a toggle that names the wanted mode ends the switch; one that names the other mode is toggled back', async() => {
  const once = toggles(['browse mode']);

  assert.deepEqual(await ensureNvdaMode({ mode: 'focus', wanted: 'browse', toggle: once.toggle }), { mode: 'browse', said: ['browse mode'] });
  assert.equal(once.presses(), 1);

  // NVDA switched to browse on its own before the toggle, so the toggle landed in focus mode.
  const back = toggles(['focus mode', 'browse mode']);

  assert.deepEqual(await ensureNvdaMode({ mode: 'focus', wanted: 'browse', toggle: back.toggle }), { mode: 'browse', said: ['focus mode', 'browse mode'] });
  assert.equal(back.presses(), 2);
});

test('silent toggles count from the last named mode: an odd number flipped it, an even number did not', async() => {
  // Every toggle silent from a known focus mode: the reader seeks a named mode while two toggles are left
  // to come back, then accepts browse mode after the third toggle, never the fourth, which would undo it.
  const silent = toggles(['', '', '', '']);
  const result = await ensureNvdaMode({ mode: 'focus', wanted: 'browse', toggle: silent.toggle });

  assert.deepEqual(result, { mode: 'browse', said: ['', '', '', inferredModeNote('browse')] });
  assert.equal(silent.presses(), 3, 'an even number of silent toggles is back where it started');

  // NVDA names focus mode once, then is silent: the parity counts from that phrase, not from the start.
  const after = toggles(['focus mode', '', '', '']);

  assert.deepEqual(await ensureNvdaMode({ mode: null, wanted: 'browse', toggle: after.toggle }),
    { mode: 'browse', said: ['focus mode', '', '', '', inferredModeNote('browse')] });
  assert.equal(after.presses(), 4);
});

test('a named mode ends a silent run; the wanted mode inferred on the last toggle is accepted', async() => {
  const late = toggles(['', '', 'browse mode']);

  assert.deepEqual(await ensureNvdaMode({ mode: 'focus', wanted: 'browse', toggle: late.toggle }), { mode: 'browse', said: ['', '', 'browse mode'] });
  assert.equal(late.presses(), 3);
});

test('the toggles ending in the other mode is a tooling failure, named or inferred', async() => {
  // Three silent toggles, then NVDA names the mode it was asked to leave: the step would run in the wrong mode.
  const wrong = toggles(['', '', 'browse mode', 'browse mode']);

  await assert.rejects(ensureNvdaMode({ mode: 'browse', wanted: 'focus', toggle: wrong.toggle }),
    /NVDA is in browse mode after 4 toggles, and the step needs focus mode/);

  const named = toggles(['focus mode']);

  await assert.rejects(ensureNvdaMode({ mode: 'focus', wanted: 'browse', toggle: named.toggle, attempts: 1 }),
    /NVDA is in focus mode after 1 toggle, and the step needs browse mode/);
});

test('with no mode ever named in the run, NVDA is outside the page\'s document: a tooling failure', async() => {
  // Guidepup's entry Tab left the page (a cell of the last column was clicked), so every toggle is silent.
  const silent = toggles([]);

  await assert.rejects(ensureNvdaMode({ mode: null, wanted: 'focus', toggle: silent.toggle, entered: ['Address and search bar'] }),
    /NVDA named no mode after 4 toggles, and none before them: it is not in the page's document \(on the way in it said "Address and search bar"\)/);
  assert.equal(silent.presses(), MODE_TOGGLES);

  // A mode NVDA named on the way in is enough: the silent toggles then count from it.
  const known = toggles(['', '', '', '']);

  assert.deepEqual(await ensureNvdaMode({ mode: 'browse', wanted: 'focus', toggle: known.toggle }),
    { mode: 'focus', said: ['', '', '', inferredModeNote('focus')] });
});
