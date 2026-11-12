/**
 * Rule id of the entry that says a file was not analyzed. These entries are not rule results: both renderers
 * list them in a "Skipped files" section.
 */
export const SKIPPED_RULE_ID = 'skipped-file';

const VERSIONED_ID = /^(\d+)\.(\d+)\.(\d+)\//;

/**
 * Order two rule ids: versioned ids (`18.0.0/slug`) first, by version and then by id, then the ids of tool
 * messages (`parse-error`, ...) by name.
 *
 * @param {string} a Rule id.
 * @param {string} b Rule id.
 * @returns {number} Negative when `a` goes first.
 */
function compareRuleIds(a, b) {
  const va = VERSIONED_ID.exec(a);
  const vb = VERSIONED_ID.exec(b);

  if (va && vb) {
    for (let index = 1; index <= 3; index += 1) {
      if (Number(va[index]) !== Number(vb[index])) {
        return Number(va[index]) - Number(vb[index]);
      }
    }

    return a.localeCompare(b);
  }

  if (va || vb) {
    return va ? -1 : 1;
  }

  return a.localeCompare(b);
}

/**
 * Collects report entries during a run. Identical entries collapse, so a transform that sees the same spot
 * twice does not report it twice. An entry with `scope: 'run'` says the same thing for every file: it is kept
 * once, with the list of the files it applies to in `files`.
 */
export class Report {
  constructor() {
    /** @type {import('./types.mjs').ReportEntry[]} */
    this.entries = [];
    this.keys = new Map();
  }

  /**
   * Add an entry. The entry is normalized: `line` and `guideUrl` default to `null`.
   *
   * @param {Partial<import('./types.mjs').ReportEntry>} entry The entry.
   * @returns {void}
   */
  add(entry) {
    const normalized = { line: null, guideUrl: null, ...entry };

    if (normalized.scope === 'run') {
      const key = ['run', normalized.ruleId, normalized.severity, normalized.message].join('\u0000');
      const existing = this.keys.get(key);

      if (existing) {
        if (!existing.files.includes(normalized.file)) {
          existing.files.push(normalized.file);
        }
      } else {
        const stored = { ...normalized, line: null, files: [normalized.file] };

        this.keys.set(key, stored);
        this.entries.push(stored);
      }

      return;
    }

    const key = [normalized.ruleId, normalized.severity, normalized.file, normalized.line, normalized.message,
      (normalized.lines ?? []).join(',')].join('\u0000');

    if (!this.keys.has(key)) {
      this.keys.set(key, normalized);
      this.entries.push(normalized);
    }
  }

  /**
   * Add several entries.
   *
   * @param {Array<Partial<import('./types.mjs').ReportEntry>>} entries The entries.
   * @returns {void}
   */
  addAll(entries) {
    entries.forEach(entry => this.add(entry));
  }

  /**
   * Count entries per severity. An entry that applies to a whole run counts once, and so does a skipped file.
   *
   * @returns {{changed: number, manual: number, warning: number}} The counts.
   */
  counts() {
    const counts = { changed: 0, manual: 0, warning: 0 };

    this.entries.forEach((entry) => {
      counts[entry.severity] += 1;
    });

    return counts;
  }

  /**
   * Whether any entry has the given rule id.
   *
   * @param {string} ruleId Rule id.
   * @returns {boolean} `true` when at least one entry matches.
   */
  has(ruleId) {
    return this.entries.some(entry => entry.ruleId === ruleId);
  }

  /**
   * The files the run did not analyze, with the reason, sorted by path.
   *
   * @returns {import('./types.mjs').ReportEntry[]} The `skipped-file` entries.
   */
  skipped() {
    return this.entries.filter(entry => entry.ruleId === SKIPPED_RULE_ID)
      .sort((a, b) => a.file.localeCompare(b.file));
  }

  /**
   * The entries that say the same for every file (`scope: 'run'`), ordered like the rule groups.
   *
   * @returns {import('./types.mjs').ReportEntry[]} The entries, each with its `files`.
   */
  once() {
    return this.entries.filter(entry => entry.scope === 'run')
      .sort((a, b) => compareRuleIds(a.ruleId, b.ruleId) || a.message.localeCompare(b.message));
  }

  /**
   * Group the entries by rule id, ordered by version and then by rule id (the ids of tool messages come last).
   * Entries are sorted by file and line. Entries that apply to a whole run and skipped files are not in a group:
   * see `once()` and `skipped()`.
   *
   * @returns {Array<{ruleId: string, guideUrl: string|null, entries: import('./types.mjs').ReportEntry[]}>} Groups.
   */
  byRule() {
    const groups = new Map();

    this.entries.filter(entry => entry.scope !== 'run' && entry.ruleId !== SKIPPED_RULE_ID).forEach((entry) => {
      if (!groups.has(entry.ruleId)) {
        groups.set(entry.ruleId, { ruleId: entry.ruleId, guideUrl: entry.guideUrl, entries: [] });
      }

      groups.get(entry.ruleId).entries.push(entry);
    });

    groups.forEach((group) => {
      group.entries.sort((a, b) => a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0));
    });

    return [...groups.values()].sort((a, b) => compareRuleIds(a.ruleId, b.ruleId));
  }
}

/**
 * Format `file:line` for an entry.
 *
 * @param {import('./types.mjs').ReportEntry} entry The entry.
 * @returns {string} The location.
 */
function location(entry) {
  return entry.line === null ? entry.file : `${entry.file}:${entry.line}`;
}

/**
 * Most locations of one rule that the console report lists before it says `+N more`.
 */
export const CONSOLE_LIMIT = 10;

/**
 * Count with a noun, for example `1 file` or `3 files`.
 *
 * @param {number} count The count.
 * @param {string} noun Singular noun.
 * @returns {string} The phrase.
 */
export function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * Write line numbers compactly: sorted, without duplicates, and a run of three or more consecutive lines as a
 * range, so `3, 4, 5, 9` becomes `3-5, 9`.
 *
 * @param {number[]} lines One-based line numbers.
 * @returns {string} The text.
 */
export function formatLines(lines) {
  const sorted = [...new Set(lines)].sort((a, b) => a - b);
  const parts = [];

  for (let index = 0; index < sorted.length;) {
    let end = index;

    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1) {
      end += 1;
    }

    if (end - index >= 2) {
      parts.push(`${sorted[index]}-${sorted[end]}`);
    } else {
      parts.push(...sorted.slice(index, end + 1).map(String));
    }

    index = end + 1;
  }

  return parts.join(', ');
}

/**
 * The text of an entry, with the line numbers of every match when the entry stands for several.
 *
 * @param {import('./types.mjs').ReportEntry} entry The entry.
 * @returns {string} The message.
 */
function messageOf(entry) {
  return entry.lines?.length > 1 ? `${entry.message} Lines: ${formatLines(entry.lines)}.` : entry.message;
}

/**
 * The one line that sums up a run. The console report and the Markdown report both print it.
 *
 * @param {Report} report The report.
 * @param {object} [options] Options.
 * @param {number} [options.filesChanged] Files the run changed, or would change.
 * @param {boolean} [options.dryRun] Whether nothing was written.
 * @returns {string} For example `Summary: 3 files changed, 12 rewrites applied, 5 manual steps, 2 warnings.`
 */
export function summaryLine(report, { filesChanged = 0, dryRun = false } = {}) {
  const counts = report.counts();
  const applied = dryRun ? 'would be applied' : 'applied';

  return `Summary: ${plural(filesChanged, 'file')} ${dryRun ? 'would change' : 'changed'}, `
    + `${plural(counts.changed, 'rewrite')} ${applied}, ${plural(counts.manual, 'manual step')}, `
    + `${plural(counts.warning, 'warning')}.`;
}

/**
 * Names of the files an entry applies to, shortened to `limit` names.
 *
 * @param {string[]} files File paths.
 * @param {number} limit Most names to list.
 * @returns {string} For example `3 files: a.ts, b.ts, c.ts, +1 more`.
 */
function fileList(files, limit) {
  const sorted = [...files].sort();
  const shown = sorted.slice(0, limit).join(', ');

  return `${plural(sorted.length, 'file')}: ${shown}${sorted.length > limit ? `, +${sorted.length - limit} more` : ''}`;
}

/**
 * Render the report for a terminal, grouped by rule (ordered by version, then rule). A rule lists at most
 * `limit` locations and then the number of the others, because the full list is in the `--report` file. After the
 * rules come the notes that apply to the whole run ("Read once") and the files that were not analyzed. The last
 * line sums up the run.
 *
 * @param {Report} report The report.
 * @param {object} [options] Options.
 * @param {number} [options.filesChanged] Files the run changed, or would change.
 * @param {boolean} [options.dryRun] Whether nothing was written.
 * @param {number} [options.limit] Locations listed per rule.
 * @returns {string} Text that ends with a newline.
 */
export function renderConsole(report, { filesChanged = 0, dryRun = false, limit = CONSOLE_LIMIT } = {}) {
  const lines = [];

  report.byRule().forEach((group) => {
    const counts = {};

    group.entries.forEach((entry) => {
      counts[entry.severity] = (counts[entry.severity] ?? 0) + 1;
    });

    lines.push(`${group.ruleId} (${Object.entries(counts).map(([name, count]) => `${count} ${name}`).join(', ')})`);
    group.entries.slice(0, limit).forEach((entry) => {
      lines.push(`  [${entry.severity}] ${location(entry)}  ${messageOf(entry)}`);
    });

    if (group.entries.length > limit) {
      lines.push(`  +${group.entries.length - limit} more (use --report <file> for the full list)`);
    }

    if (group.guideUrl) {
      lines.push(`  Guide: ${group.guideUrl}`);
    }

    lines.push('');
  });

  const once = report.once();

  if (once.length > 0) {
    lines.push(`Read once (${once.length})`);
    once.forEach((entry) => {
      lines.push(`  [${entry.severity}] ${entry.ruleId}  ${entry.message} (${fileList(entry.files, 3)})`);
    });
    lines.push('');
  }

  const skipped = report.skipped();

  if (skipped.length > 0) {
    lines.push(`Skipped files (${skipped.length})`);
    skipped.slice(0, limit).forEach(entry => lines.push(`  ${entry.file}  ${entry.message}`));

    if (skipped.length > limit) {
      lines.push(`  +${skipped.length - limit} more (use --report <file> for the full list)`);
    }

    lines.push('');
  }

  lines.push(summaryLine(report, { filesChanged, dryRun }));

  return `${lines.join('\n')}\n`;
}

/**
 * Render the report as a Markdown checklist: the same summary line as the console, one section per rule (ordered
 * by version, then rule) with its guide link and one checkbox per entry (`- [ ] path:line message`), a "Read once"
 * section for the notes that apply to the whole run, and a "Skipped files" section. A rewrite is checked, work left
 * to the user is not. The list is complete: the limit of the console report does not apply.
 *
 * @param {Report} report The report.
 * @param {object} [options] Options.
 * @param {string} [options.title] Document title.
 * @param {number} [options.filesChanged] Files the run changed, or would change.
 * @param {boolean} [options.dryRun] Whether nothing was written.
 * @returns {string} Markdown that ends with a newline.
 */
export function renderMarkdown(report, {
  title = 'Handsontable migration report',
  filesChanged = 0,
  dryRun = false,
} = {}) {
  const lines = [`# ${title}`, '', summaryLine(report, { filesChanged, dryRun }), ''];

  if (report.entries.length === 0) {
    lines.push('Nothing to report.', '');
  }

  report.byRule().forEach((group) => {
    lines.push(`## ${group.ruleId}`, '');

    if (group.guideUrl) {
      lines.push(`Guide: ${group.guideUrl}`, '');
    }

    group.entries.forEach((entry) => {
      const mark = entry.severity === 'changed' ? 'x' : ' ';
      const tag = entry.severity === 'warning' ? '(warning) ' : '';

      lines.push(`- [${mark}] ${location(entry)} ${tag}${messageOf(entry)}`);
    });

    lines.push('');
  });

  const once = report.once();

  if (once.length > 0) {
    lines.push('## Read once', '', 'These notes hold for every file that uses the rule. Each is listed one time.', '');
    once.forEach((entry) => {
      lines.push(`- [ ] ${entry.ruleId} ${entry.message}`, `  - ${fileList(entry.files, entry.files.length)}`);
    });
    lines.push('');
  }

  const skipped = report.skipped();

  if (skipped.length > 0) {
    lines.push('## Skipped files', '', 'The tool did not analyze these files. Check them by hand.', '');
    skipped.forEach(entry => lines.push(`- [ ] ${entry.file} ${entry.message}`));
    lines.push('');
  }

  return `${lines.join('\n')}`;
}
