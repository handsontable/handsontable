/**
 * A comma-separated subset input of an accessibility nightly dispatch (`checks` on the A11y nightly,
 * `projects` and `groups` on the screen reader nightly), read one way everywhere: an entry is a whole
 * known name, exactly. The lane jobs of `.github/workflows/screenreader.yml` match an entry as
 * `contains(format(',{0},', inputs.projects), ',<name>,')`, which no expression can trim, so a space or
 * a typo is refused before anything runs rather than skipped on one side and expected on the other: a
 * lane the input skips is a check run the verdict expects, and the run ends red for the wrong reason
 * after a macOS runner was spent (`tests/AGENTS.md`, "A11y: the audit and the proof runs").
 */

/**
 * The known names a subset input names, in the known order, each once; `null` when the input is empty
 * (an empty dispatch input is no subset).
 *
 * @param {string|undefined} input The input as dispatched.
 * @param {string[]} known The names the input may use.
 * @param {{label: string, noun: string}} what What the input is called in the message, and what it names.
 * @returns {string[]|null} The subset, or `null` for no subset.
 * @throws {Error} On an entry that is not a known name, a space or an empty entry included.
 */
export function namedSubset(input, known, { label, noun }) {
  if (input === undefined || input === '') {
    return null;
  }

  const entries = input.split(',');
  const unknown = entries.find(entry => !known.includes(entry));

  if (unknown !== undefined) {
    throw new Error(`${label} names no ${noun} ${JSON.stringify(unknown)} (comma-separated, no spaces); the ${noun}s are ${known.join(', ')}.`);
  }

  return known.filter(name => entries.includes(name));
}
