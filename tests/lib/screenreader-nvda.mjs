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
 * - in the other mode, named or inferred: it throws, a tooling failure, because a read in focus mode sends
 *   its Down Arrow to the page and a press in browse mode moves NVDA's cursor instead of the grid's;
 * - in no mode at all, because NVDA named none in the run, neither before nor by a toggle: it throws too.
 *   NVDA is then outside the page's document (the browser's toolbar after Guidepup's entry Tab left the
 *   page, or the Windows Start menu once), where a toggle says nothing and no step would be spoken, so
 *   the run's retry starts over with a fresh browser and NVDA.
 *
 * @param {object} input The input.
 * @param {'focus'|'browse'|null} input.mode The mode NVDA is in, named or inferred from a named one, or
 * `null` while NVDA has named none in the run.
 * @param {'focus'|'browse'} input.wanted The mode the primitive needs.
 * @param {() => Promise<string>} input.toggle Presses the toggle and returns what NVDA said.
 * @param {number} [input.attempts] The most toggles, `MODE_TOGGLES` by default.
 * @param {string[]} [input.entered] What NVDA said on the way into the page, for the error.
 * @returns {Promise<{mode: 'focus'|'browse', said: string[]}>} The mode the run goes on in, and what the
 * toggles said (the step's `preparing`).
 */
export async function ensureNvdaMode({ mode, wanted, toggle, attempts = MODE_TOGGLES, entered = [] }) {
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
    throw new Error(`NVDA named no mode after ${said.length} toggle${said.length === 1 ? '' : 's'}, and none before them: it is not in the page's document (on the way in it said ${JSON.stringify(entered.join(' '))}), so no step would be spoken. The lane's entry failed, not the grid; the retry starts over.`);
  }
  if (current !== wanted) {
    throw new Error(`NVDA is in ${current} mode after ${attempts} toggle${attempts === 1 ? '' : 's'}, and the step needs ${wanted} mode (the toggles said: ${said.map(phrase => JSON.stringify(phrase)).join(', ')})`);
  }
  if (!named) {
    said.push(inferredModeNote(wanted));
  }

  return { mode: wanted, said };
}
