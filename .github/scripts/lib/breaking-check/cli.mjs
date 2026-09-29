/**
 * The pure parts of the `breaking-check.mjs` CLI: argument parsing, the git
 * range it diffs, and the human summary. No process, network, or filesystem
 * access, so each is unit-tested directly.
 */
import { parseArgs } from 'node:util';

const OPTIONS = {
  base: { type: 'string' },
  head: { type: 'string' },
  commit: { type: 'string' },
  'merge-parent': { type: 'boolean', default: false },
  'no-merge-base': { type: 'boolean', default: false },
  'no-jev': { type: 'boolean', default: false },
  json: { type: 'boolean', default: false },
  render: { type: 'boolean', default: false },
  out: { type: 'string' },
  'from-json': { type: 'string' },
  comment: { type: 'string' },
  cwd: { type: 'string' },
};

/**
 * @param {string[]} argv
 * @returns {object} The parsed options.
 * @throws {Error} On an unknown flag or a contradictory combination.
 */
export function parseCli(argv) {
  const { values } = parseArgs({ args: argv, options: OPTIONS, strict: true });
  const rangeModes = [values.commit !== undefined, values['merge-parent'], values.base !== undefined || values.head !== undefined];

  if (rangeModes.filter(Boolean).length > 1) {
    throw new Error('Use only one of --commit, --merge-parent, or --base/--head.');
  }
  if (values.comment !== undefined && !/^\d+$/.test(values.comment)) {
    throw new Error('--comment takes a pull request number.');
  }

  return {
    base: values.base,
    head: values.head,
    commit: values.commit,
    mergeParent: values['merge-parent'],
    noMergeBase: values['no-merge-base'],
    noJev: values['no-jev'],
    json: values.json,
    render: values.render,
    out: values.out,
    fromJson: values['from-json'],
    comment: values.comment === undefined ? undefined : Number(values.comment),
    cwd: values.cwd,
  };
}

// Fixed flags so a user's git config (`diff.external`, `diff.noprefix`, ...) cannot change what is parsed.
const DIFF_FLAGS = ['--no-color', '--no-ext-diff', '--src-prefix=a/', '--dst-prefix=b/', '--unified=3'];

/**
 * The diff command and the ref to grep for a range. Runs git only through the
 * injected runner (for `merge-base` and the parent count).
 *
 * @param {object} options `parseCli()` output.
 * @param {(args: string[]) => string} git
 * @returns {{ diffArgs: string[] | null, ref: string, warning?: string }} `diffArgs` is `null`, with a
 *   `warning`, when `--merge-parent` runs on a commit that is not a merge commit.
 */
export function resolveRange(options, git) {
  const diff = DIFF_FLAGS;

  if (options.commit) {
    return { diffArgs: ['show', '--format=', ...diff, options.commit], ref: options.commit };
  }

  if (options.mergeParent) {
    const parents = git(['rev-list', '--parents', '-n', '1', 'HEAD']).trim().split(/\s+/).length - 1;

    if (parents !== 2) {
      return {
        diffArgs: null,
        ref: 'HEAD',
        warning: `--merge-parent needs a merge commit with two parents, but HEAD has ${parents}; skipping the check.`,
      };
    }

    return { diffArgs: ['diff', ...diff, 'HEAD^1', 'HEAD'], ref: 'HEAD' };
  }

  const head = options.head ?? 'HEAD';
  const base = options.base ?? 'origin/develop';
  const from = options.noMergeBase ? base : git(['merge-base', base, head]).trim();

  return { diffArgs: ['diff', ...diff, from, head], ref: head };
}

/**
 * A short human summary of a `detect()` result.
 *
 * @param {object} result
 * @returns {string}
 */
export function summarize(result) {
  const lines = [
    `Flagged: ${result.flagged ? 'yes' : 'no'}${result.declared.breakingEntry ? ' (changelog entry already marked breaking)' : ''}`,
    `Removed public names: ${result.removedNames.length} of ${result.candidateCount} gone candidates`
      + `${result.candidateCount === 0 ? '' : ` (${result.jevUsed ? `Jev scored ${result.sentToJev}` : 'code-only, no Jev'})`}`,
  ];

  for (const item of result.removedNames) {
    const score = item.publicScore === null ? '' : ` score ${item.publicScore.toFixed(3)}`;

    lines.push(`  - ${item.name} (${item.kind}) ${item.file}${score}`);
  }

  if ((result.removedRegistryAdded?.length ?? 0) > 0) {
    lines.push(`Added to removed lists: ${result.removedRegistryAdded.map((a) => `${a.name} (${a.registry})`).join(', ')}`);
  }

  lines.push(`Option default changed: ${result.defaultsTouched ? `yes, ${result.defaultsEvidence}` : 'no'}`);

  return lines.join('\n');
}
