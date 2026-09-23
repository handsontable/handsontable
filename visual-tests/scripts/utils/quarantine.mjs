/**
 * Reads the visual quarantine for the scripts that apply it: the pull request gate, the nightly report,
 * and the compare record.
 *
 * Explicit on purpose: the file is read only when `VISUAL_QUARANTINE_FILE` names it. `visual-gate.mjs`
 * also serves the docs suite (`.github/actions/docs-visual-run`), whose items can never match a core
 * capture – an implicit default would make that a silent no-op today and a contract nobody chose. The
 * core workflow sets the variable; the docs action does not, and a test pins both.
 *
 * An unreadable or wrongly shaped file is an error rather than an empty quarantine: reading it as empty
 * would unblock nothing, which is safe, but it would also hide that the file is broken. An entry that is
 * merely invalid (a bad date, a missing leg) is not an error here – `partitionReport()` never treats it as
 * live, so its items keep blocking, and the tooling suite reports the entry on every pull request.
 */

import { readFileSync } from 'node:fs';

/**
 * The quarantine entries, or none when no file is named.
 *
 * @param {string | undefined} path The file, from `VISUAL_QUARANTINE_FILE`.
 * @returns {Array<object>} The entries.
 * @throws {Error} When the file is named but cannot be read as `{ entries: [...] }`.
 */
export function readQuarantineEntries(path) {
  if (!path) {
    return [];
  }

  let file;

  try {
    file = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`The visual quarantine ${path} could not be read (${error.message}).`);
  }

  if (!file || !Array.isArray(file.entries)) {
    throw new Error(`The visual quarantine ${path} is not an object with an \`entries\` array.`);
  }

  return file.entries;
}
