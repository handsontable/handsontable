/**
 * Collects report entries during a run. Identical entries collapse, so a transform that sees the same spot
 * twice does not report it twice.
 */
export class Report {
  constructor() {
    /** @type {import('./types.mjs').ReportEntry[]} */
    this.entries = [];
    this.keys = new Set();
  }

  /**
   * Add an entry. The entry is normalized: `line` and `guideUrl` default to `null`.
   *
   * @param {Partial<import('./types.mjs').ReportEntry>} entry The entry.
   * @returns {void}
   */
  add(entry) {
    const normalized = { line: null, guideUrl: null, ...entry };
    const key = [normalized.ruleId, normalized.severity, normalized.file, normalized.line, normalized.message]
      .join('\u0000');

    if (!this.keys.has(key)) {
      this.keys.add(key);
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
   * Count entries per severity.
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
   * Group the entries by rule id. Groups keep first-seen order, entries are sorted by file and line.
   *
   * @returns {Array<{ruleId: string, guideUrl: string|null, entries: import('./types.mjs').ReportEntry[]}>} Groups.
   */
  byRule() {
    const groups = new Map();

    this.entries.forEach((entry) => {
      if (!groups.has(entry.ruleId)) {
        groups.set(entry.ruleId, { ruleId: entry.ruleId, guideUrl: entry.guideUrl, entries: [] });
      }

      groups.get(entry.ruleId).entries.push(entry);
    });

    groups.forEach((group) => {
      group.entries.sort((a, b) => a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0));
    });

    return [...groups.values()];
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
function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * Render the report for a terminal, grouped by rule. A rule lists at most `limit` locations and then the number
 * of the others, because the full list is in the `--report` file. The last line sums up the run.
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
      lines.push(`  [${entry.severity}] ${location(entry)}  ${entry.message}`);
    });

    if (group.entries.length > limit) {
      lines.push(`  +${group.entries.length - limit} more (use --report <file> for the full list)`);
    }

    if (group.guideUrl) {
      lines.push(`  Guide: ${group.guideUrl}`);
    }

    lines.push('');
  });

  const counts = report.counts();
  const applied = dryRun ? 'would be applied' : 'applied';

  lines.push(`Summary: ${plural(filesChanged, 'file')} ${dryRun ? 'would change' : 'changed'}, `
    + `${plural(counts.changed, 'rewrite')} ${applied}, ${plural(counts.manual, 'manual step')}, `
    + `${plural(counts.warning, 'warning')}.`);

  return `${lines.join('\n')}\n`;
}

/**
 * Render the report as a Markdown checklist: one section per rule with its guide link, one checkbox per entry
 * (`- [ ] path:line message`). A rewrite is checked, work left to the user is not. The list is complete: the
 * limit of the console report does not apply.
 *
 * @param {Report} report The report.
 * @param {object} [options] Options.
 * @param {string} [options.title] Document title.
 * @returns {string} Markdown that ends with a newline.
 */
export function renderMarkdown(report, { title = 'Handsontable migration report' } = {}) {
  const counts = report.counts();
  const lines = [
    `# ${title}`,
    '',
    `${counts.changed} changed, ${counts.manual} to do by hand, ${counts.warning} warning.`,
    '',
  ];

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

      lines.push(`- [${mark}] ${location(entry)} ${tag}${entry.message}`);
    });

    lines.push('');
  });

  return `${lines.join('\n')}`;
}
