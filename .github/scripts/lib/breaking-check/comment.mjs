/**
 * The advisory PR comment: when to post it and what it says. Pure text, no
 * network.
 */

export const MARKER = '<!-- breaking-check -->';

const MAX_LISTED = 15;

/**
 * Comment when the check flagged something the author has not already
 * declared. A `breaking: true` changelog entry declares a removed name or a
 * removed-list entry, but never a default change: changing a default is
 * forbidden whatever the changelog says.
 *
 * @param {{ flagged: boolean, defaultsTouched: boolean, declared: { breakingEntry: boolean } }} result
 * @returns {boolean}
 */
export function shouldComment(result) {
  return result.defaultsTouched || (result.flagged && !result.declared.breakingEntry);
}

/**
 * Wrap text in a Markdown code span whose delimiter is longer than any
 * backtick run inside it, so text taken from a diff cannot break out of it.
 *
 * @param {string} text
 * @returns {string}
 */
function codeSpan(text) {
  const flat = String(text).replace(/\s+/g, ' ');
  const longestRun = Math.max(0, ...(flat.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(longestRun + 1);
  const pad = flat.startsWith('`') || flat.endsWith('`') ? ' ' : '';

  return `${fence}${pad}${flat}${pad}${fence}`;
}

/**
 * Renders one flagged name. The raw Jev score stays out of the comment: every listed name already
 * cleared the calibrated threshold, and a low-looking number such as 0.14 on a plainly public
 * method reads as "probably not public" to a reviewer. The score is kept in the result JSON and
 * the job summary instead.
 *
 * @param {{ name: string, kind: string, file: string, publicScore: number | null }} item
 * @returns {string}
 */
function renderName(item) {
  const note = item.publicScore === null ? ', not checked by Jev' : '';

  return `- ${codeSpan(item.name)} (${item.kind}) in ${codeSpan(item.file)}${note}`;
}

const ADVICE = {
  names: '**Removed or renamed public names.** Keep the old name working as a deprecated alias that prints a one-time warning, as `.ai/BREAKING-CHANGES.md` requires. Mark the changelog entry `"breaking": true` only if it is removed in a major release. If a name is internal, ignore it.',
  defaults: '**Default change.** Changing a default is strictly forbidden by `.ai/BREAKING-CHANGES.md`. Revert it. If the line is not a default change, ignore this.',
  registry: '**Removed hook or option.** Confirm this is the major release that ends the deprecation, then mark the changelog entry `"breaking": true`.',
};

/**
 * @param {object} result A `detect()` result.
 * @returns {string} Markdown, without the marker.
 */
export function renderComment(result) {
  // A `breaking: true` entry declares names and removed-list entries, so they are neither listed
  // nor advised on; a default change is never declared away.
  const declared = result.declared.breakingEntry;
  const names = declared ? [] : result.removedNames;
  const registry = declared ? [] : (result.removedRegistryAdded ?? []);
  const lines = [
    '### Possible breaking change',
    '',
    'This is an advisory check. It does not block the pull request, and it can be wrong.',
    '',
  ];

  if (names.length > 0) {
    lines.push('Public names this pull request appears to remove or rename:', '');
    lines.push(...names.slice(0, MAX_LISTED).map(renderName));

    if (names.length > MAX_LISTED) {
      lines.push(`- and ${names.length - MAX_LISTED} more`);
    }
    lines.push('');
  }

  if (registry.length > 0) {
    lines.push('Entries added to the removed-hooks and removed-options lists:', '');
    lines.push(...registry.map((a) => `- ${codeSpan(a.name)} added to \`${a.registry}\``), '');
  }

  const unscored = declared ? 0 : (result.unscoredNames?.length ?? 0);

  if (unscored > 0) {
    lines.push(`${unscored} removed ${unscored === 1 ? 'name was' : 'names were'} not scored.`, '');
  }

  const unchecked = declared ? 0 : (result.uncheckedCount ?? 0);

  if (unchecked > 0) {
    lines.push(`${unchecked} more removed ${unchecked === 1 ? 'name was' : 'names were'} not checked.`, '');
  }

  if (result.defaultsTouched) {
    lines.push(`An option default in \`metaSchema\` appears to change: ${codeSpan(result.defaultsEvidence)}`, '');
  }

  if (names.length > 0) {
    lines.push(ADVICE.names, '');
  }
  if (result.defaultsTouched) {
    lines.push(ADVICE.defaults, '');
  }
  if (registry.length > 0) {
    lines.push(ADVICE.registry, '');
  }

  lines.push(
    '**Scope.** The check only looks at removed or renamed public names, `metaSchema` default changes, and hooks or options added to `REMOVED_HOOKS` or `REMOVED_OPTIONS`. It does not check behavior, DOM structure, or CSS property or value changes, so no comment is not an all-clear.',
    '',
    'On 250 past pull requests, this check flagged 14 (6%); most of those were not real breaking changes.',
  );

  return lines.join('\n');
}

/**
 * The text that replaces a comment the check no longer stands behind.
 *
 * @param {{ flagged: boolean, declared: { breakingEntry: boolean } }} result The current `detect()` result.
 * @returns {string} Markdown, without the marker.
 */
export function renderCleared(result) {
  const reason = result.declared.breakingEntry && result.flagged
    ? 'The changelog entry now declares this breaking change.'
    : 'A later push no longer triggers the check.';

  return ['### Possible breaking change', '', reason].join('\n');
}
