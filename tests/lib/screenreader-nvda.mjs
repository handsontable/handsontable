/**
 * The mode switch of the NVDA reader: the part of `screenreader/screenreader.spec.ts` that decides
 * which mode NVDA is in and needs no NVDA to prove.
 *
 * A page action runs in focus mode and a reading command in browse mode, so before a primitive the
 * reader toggles (NVDA+Space) until NVDA is in the mode the primitive needs. NVDA names the mode it
 * lands in, but Guidepup can miss the phrase, so a toggle can be silent. Every toggle flips the mode,
 * so the mode after silent toggles follows from the last mode NVDA named and how many toggles came
 * after it: an odd number flipped it, an even number did not.
 *
 * No I/O in here: the spec passes the toggle, which presses the keys and returns what NVDA said.
 */

/**
 * How many times the reader toggles before a primitive: two when NVDA names the mode it lands in (a
 * toggle that landed in the other mode is toggled back), and up to four when toggles are silent.
 */
export const MODE_TOGGLES = 4;

/**
 * The step's `preparing` entry when no toggle named a mode and NVDA named none before: the run goes on in
 * the mode it asked for, and the transcript says that mode was not confirmed.
 */
export const NO_MODE_ANNOUNCED = '(no mode announced after the toggle)';

/**
 * The last mode NVDA named in some phrases: the last mode phrase wins, inside one phrase too (`focus mode.
 * browse mode` is browse mode).
 *
 * @param {unknown[]} phrases The phrases, as NVDA spoke them (never normalized: the normalizer strips the
 * mode phrases as chatter).
 * @returns {'focus'|'browse'|null} The mode, or `null` when none names one.
 */
export function lastNvdaMode(phrases) {
  return phrases.reduce((mode, phrase) => {
    const found = [...String(phrase).toLowerCase().matchAll(/\b(focus|browse) mode\b/g)];

    return found.length > 0 ? found[found.length - 1][1] : mode;
  }, null);
}

/**
 * The step's `preparing` entry when the mode was inferred: the last toggles were silent, and the mode
 * follows from the last one NVDA named.
 *
 * @param {'focus'|'browse'} mode The inferred mode.
 * @returns {string} The entry.
 */
export function inferredModeNote(mode) {
  return `(no mode announced after the toggle; ${mode} mode by the count of toggles since NVDA last named one)`;
}

/**
 * Toggles NVDA into the mode a primitive needs. Each toggle that names a mode sets it; each silent one
 * flips the mode the reader knows, when it knows one. The reader keeps toggling until NVDA names the
 * wanted mode, and accepts an inferred one when fewer than two toggles are left (going past it would need
 * two to come back). When the toggles end:
 *
 * - in the wanted mode, named or inferred: the run goes on; an inferred mode adds a note to `said`;
 * - in a mode never named, before or by a toggle: the run goes on in the wanted mode, and `said` ends
 *   with `NO_MODE_ANNOUNCED`;
 * - in the other mode, named or inferred: it throws, a tooling failure, because a read in focus mode sends
 *   its Down Arrow to the page and a press in browse mode moves NVDA's cursor instead of the grid's.
 *
 * @param {object} input The input.
 * @param {'focus'|'browse'|null} input.mode The mode NVDA last named, or `null`.
 * @param {'focus'|'browse'} input.wanted The mode the primitive needs.
 * @param {() => Promise<string>} input.toggle Presses the toggle and returns what NVDA said.
 * @param {number} [input.attempts] The most toggles, `MODE_TOGGLES` by default.
 * @returns {Promise<{mode: 'focus'|'browse', said: string[]}>} The mode the run goes on in, and what the
 * toggles said (the step's `preparing`).
 */
export async function ensureNvdaMode({ mode, wanted, toggle, attempts = MODE_TOGGLES }) {
  const said = [];
  let current = mode;
  let named = true;

  for (let done = 0; done < attempts; done += 1) {
    if (current === wanted && (named || attempts - done < 2)) {
      break;
    }

    const toggled = await toggle();
    const heard = lastNvdaMode([toggled]);

    said.push(toggled);
    named = heard !== null;

    if (heard !== null) {
      current = heard;
    } else if (current !== null) {
      current = current === 'focus' ? 'browse' : 'focus';
    }
  }

  if (current === null) {
    said.push(NO_MODE_ANNOUNCED);

    return { mode: wanted, said };
  }
  if (current !== wanted) {
    throw new Error(`NVDA is in ${current} mode after ${attempts} toggle${attempts === 1 ? '' : 's'}, and the step needs ${wanted} mode (the toggles said: ${said.map(phrase => JSON.stringify(phrase)).join(', ')})`);
  }
  if (!named) {
    said.push(inferredModeNote(wanted));
  }

  return { mode: wanted, said };
}
