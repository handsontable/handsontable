import { plainName, plainText } from './lib/markdown.mjs';
import { redact } from './lib/redact.mjs';
import { compareRuleIds } from './report.mjs';

/**
 * Version of the JSON document that `--json` prints. It changes only when a field is removed or changes its meaning:
 * a new field is not a new version.
 */
export const SCHEMA_VERSION = 1;

/**
 * The exact argument that asks for JSON output.
 */
const FLAG = '--json';

/**
 * Whether the arguments ask for JSON output. The check reads the raw arguments, so it also holds for an error that
 * `parseArgs` throws before it returns any value: the exact token `--json` counts, anywhere before a `--`
 * terminator, and `--json=x` does not.
 *
 * @param {string[]} argv The arguments after the script path.
 * @returns {boolean} `true` when `--json` is among them.
 */
export function wantsJson(argv) {
  return hasToken(argv, FLAG);
}

/**
 * Whether the arguments hold the exact token, anywhere before a `--` terminator.
 *
 * @param {string[]} argv The arguments after the script path.
 * @param {string} token The flag, for example `--json`.
 * @returns {boolean} `true` when it is among them.
 */
function hasToken(argv, token) {
  const end = argv.indexOf('--');

  return (end === -1 ? argv : argv.slice(0, end)).includes(token);
}

/**
 * Whether the arguments ask for the list of rules. Like `wantsJson()` it reads the raw arguments, so an error that
 * `parseArgs` throws before it returns any value still gets the document of the mode the command was about to run.
 *
 * @param {string[]} argv The arguments after the script path.
 * @returns {boolean} `true` when the exact token `--list` is among them.
 */
export function wantsList(argv) {
  return hasToken(argv, '--list');
}

/**
 * Make a value safe to print: the user information of a URL is hidden and a control character or a bidirectional
 * override is written as `\x1b`, as in every other byte the tool prints. The result holds only characters that
 * `JSON.stringify` writes as they are, so it is valid JSON whatever a file name or a source line held.
 *
 * @param {unknown} value A string, or an array or object that holds strings.
 * @returns {unknown} The same shape with every string made safe.
 */
export function cleanDeep(value) {
  if (typeof value === 'string') {
    return redact(plainText(value));
  }

  if (Array.isArray(value)) {
    return value.map(cleanDeep);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanDeep(item)]));
  }

  return value;
}

/**
 * Write a document as the text that goes to standard output: indented with two spaces, one line break at the end.
 *
 * @param {object} document The document.
 * @returns {string} The text.
 */
export function serialize(document) {
  return `${JSON.stringify(cleanDeep(document), null, 2)}\n`;
}

/**
 * The fields every document starts with.
 *
 * @param {{name: string, version: string}} tool The tool.
 * @param {'run'|'list'} mode What the command did.
 * @returns {{schemaVersion: number, tool: {name: string, version: string}, mode: string}} The head.
 */
function head(tool, mode) {
  return { schemaVersion: SCHEMA_VERSION, tool: { name: tool.name, version: tool.version }, mode };
}

/**
 * The counts of a run when nothing ran.
 *
 * @returns {object} Every count 0.
 */
function noCounts() {
  return { changed: 0, manual: 0, review: 0, warning: 0, notes: 0, marked: 0, markedReview: 0, filesChanged: 0 };
}

/**
 * A file name as every other output of the tool spells it: each control character, the line break and the tab
 * included, as `\xNN`, and a bidirectional override as `\uNNNN`. A name with a line break reads the same in the
 * console, in the Markdown report, and here, and JSON needs no escape of its own for it.
 *
 * @param {string|null|undefined} file A file name, or nothing.
 * @returns {string|null|undefined} The spelled name, or the nothing it was given.
 */
function spelled(file) {
  return typeof file === 'string' ? plainName(file) : file;
}

/**
 * A guide change that no rule covers, as the document lists it.
 *
 * @param {object} item An item of `plan.notAutomated`.
 * @returns {object} `version`, `guide` (anchor) or `title`, `guideUrl`, `reason`.
 */
function notAutomatedOf(item) {
  return {
    version: item.version,
    guide: item.guide ?? null,
    title: item.title ?? null,
    guideUrl: item.guideUrl ?? null,
    reason: item.reason,
  };
}

/**
 * One report entry, as the document lists it. A note that holds for every file (`scope: "run"`) has no `file` and
 * lists its `files`.
 *
 * @param {import('./types.mjs').ReportEntry} entry The stored entry.
 * @returns {object} The entry.
 */
function entryOf(entry) {
  const run = entry.scope === 'run';

  return {
    ruleId: entry.ruleId,
    severity: entry.severity,
    file: run ? null : spelled(entry.file),
    line: entry.line ?? null,
    lines: entry.lines ?? [],
    message: entry.message,
    guideUrl: entry.guideUrl ?? null,
    marker: entry.marked === true,
    ...(run ? { scope: 'run', files: [...(entry.files ?? [])].sort().map(spelled) } : {}),
  };
}

/**
 * Order entries as the reports do: by rule (version, then id), then file and line.
 *
 * @param {import('./types.mjs').ReportEntry[]} entries The stored entries.
 * @returns {import('./types.mjs').ReportEntry[]} A sorted copy.
 */
function sortedEntries(entries) {
  return [...entries].sort((a, b) => compareRuleIds(a.ruleId, b.ruleId)
    || (a.file ?? '').localeCompare(b.file ?? '')
    || (a.line ?? 0) - (b.line ?? 0)
    || a.message.localeCompare(b.message));
}

/**
 * The document of a `migrate` run that got as far as a result: finished, refused, or interrupted.
 *
 * @param {object} args Arguments.
 * @param {{name: string, version: string}} args.tool The tool.
 * @param {object} args.result The result of `run()`.
 * @param {boolean} args.dryRun Whether the run wrote no file.
 * @param {number} args.exitCode The exit code the command ends with.
 * @returns {object} The document.
 */
export function runDocument({ tool, result, dryRun, exitCode }) {
  const { report } = result;
  const counts = { ...noCounts(), ...report.counts(), filesChanged: result.changedFiles.length };

  return {
    ...head(tool, 'run'),
    from: result.from || null,
    to: result.to || null,
    dryRun,
    exitCode,
    interrupted: result.interrupted === true,
    counts,
    changedFiles: result.changedFiles.map(spelled),
    entries: sortedEntries(report.entries).map(entryOf),
    notAutomated: (result.notAutomated ?? []).map(notAutomatedOf),
    skipped: report.skipped().map(entry => ({ file: spelled(entry.file), reason: entry.message })),
    notes: [...result.notes],
    changes: dryRun ? result.diffs.map(({ file, diff }) => ({ file: spelled(file), diff }))
      .sort((a, b) => a.file.localeCompare(b.file)) : [],
    error: result.error ?? failureText(report),
  };
}

/**
 * What a run says about its files that failed: how many it could not read, and how many it could not write. `null` when
 * every file was handled.
 *
 * @param {import('./report.mjs').Report} report The report.
 * @returns {string|null} The text.
 */
function failureText(report) {
  const { read, written } = report.failedFiles();
  const parts = [];

  if (read.size > 0) {
    parts.push(`${read.size === 1 ? '1 file' : `${read.size} files`} could not be read.`);
  }

  if (written.size > 0) {
    parts.push(`${written.size === 1 ? '1 file' : `${written.size} files`} could not be written.`);
  }

  return parts.length > 0 ? `${parts.join(' ')} See the entries with the rule ids parse-error, transform-error, `
    + 'read-error, and write-error.' : null;
}

/**
 * The document of a `migrate --list` run.
 *
 * @param {object} args Arguments.
 * @param {{name: string, version: string}} args.tool The tool.
 * @param {Array<object>} args.rows The rows of `describeRules()`.
 * @param {object[]} args.notAutomated The `notAutomated` items of the plan.
 * @param {string[]} args.notes The notes the plan gave.
 * @param {string} args.from The version the plan starts from.
 * @param {string} args.to The newest version in the plan.
 * @returns {object} The document.
 */
export function listDocument({ tool, rows, notAutomated, notes, from, to }) {
  const implemented = rows.filter(row => row.implemented);

  return {
    ...head(tool, 'list'),
    from: from || null,
    to: to || null,
    exitCode: 0,
    counts: {
      rules: rows.length,
      rewrite: implemented.filter(row => row.mode === 'rewrite').length,
      report: implemented.filter(row => row.mode === 'report').length,
      notImplemented: rows.length - implemented.length,
      notAutomated: notAutomated.length,
    },
    rules: rows.map(row => ({
      id: row.id,
      version: row.version,
      kind: row.kind,
      action: row.mode,
      severity: row.severity,
      guideUrl: row.guideUrl,
      implemented: row.implemented,
    })),
    notAutomated: notAutomated.map(notAutomatedOf),
    notes: [...notes],
    error: null,
  };
}

/**
 * The document of a command that ended before it had a result: a usage error, a refusal, or a crash. It has the
 * shape of the mode, with nothing found.
 *
 * @param {object} args Arguments.
 * @param {{name: string, version: string}} args.tool The tool.
 * @param {'run'|'list'} args.mode What the command was about to do.
 * @param {number} args.exitCode The exit code.
 * @param {string} args.error What went wrong, one message.
 * @param {boolean} [args.dryRun] Whether `--dry-run` was given.
 * @param {string[]} [args.notes] Notes that were printed before the error.
 * @returns {object} The document.
 */
export function errorDocument({ tool, mode, exitCode, error, dryRun = false, notes = [] }) {
  if (mode === 'list') {
    return {
      ...head(tool, 'list'),
      from: null,
      to: null,
      exitCode,
      counts: { rules: 0, rewrite: 0, report: 0, notImplemented: 0, notAutomated: 0 },
      rules: [],
      notAutomated: [],
      notes: [...notes],
      error,
    };
  }

  return {
    ...head(tool, 'run'),
    from: null,
    to: null,
    dryRun,
    exitCode,
    interrupted: false,
    counts: noCounts(),
    changedFiles: [],
    entries: [],
    notAutomated: [],
    skipped: [],
    notes: [...notes],
    changes: [],
    error,
  };
}
