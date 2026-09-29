/**
 * The advisory PR comment: when to post it and what it says. Pure text, no
 * network.
 */

export const MARKER = '<!-- breaking-check -->';

const MAX_LISTED = 15;

/**
 * Comment only when the check flagged something the author has not already
 * declared with a `breaking: true` changelog entry.
 *
 * @param {{ flagged: boolean, declared: { breakingEntry: boolean } }} result
 * @returns {boolean}
 */
export function shouldComment(result) {
  return result.flagged && !result.declared.breakingEntry;
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

/**
 * @param {object} result A `detect()` result.
 * @returns {string} Markdown, without the marker.
 */
export function renderComment(result) {
  const lines = [
    '### Possible breaking change',
    '',
    'This is an advisory check. It does not block the pull request, and it can be wrong.',
    '',
  ];

  if (result.removedNames.length > 0) {
    lines.push('Public names this pull request appears to remove or rename:', '');
    lines.push(...result.removedNames.slice(0, MAX_LISTED).map(renderName));

    if (result.removedNames.length > MAX_LISTED) {
      lines.push(`- and ${result.removedNames.length - MAX_LISTED} more`);
    }
    lines.push('');
  }

  if ((result.removedRegistryAdded?.length ?? 0) > 0) {
    lines.push('Entries added to the removed-hooks and removed-options lists:', '');
    lines.push(...result.removedRegistryAdded.map((a) => `- ${codeSpan(a.name)} added to \`${a.registry}\``), '');
  }

  const unscored = result.unscoredNames?.length ?? 0;

  if (unscored > 0) {
    lines.push(`${unscored} removed ${unscored === 1 ? 'name was' : 'names were'} not scored.`, '');
  }

  const unchecked = result.uncheckedCount ?? 0;

  if (unchecked > 0) {
    lines.push(`${unchecked} more removed ${unchecked === 1 ? 'name was' : 'names were'} not checked.`, '');
  }

  if (result.defaultsTouched) {
    lines.push(`An option default in \`metaSchema\` appears to change: ${codeSpan(result.defaultsEvidence)}`, '');
  }

  lines.push(
    '**What to do.** If the change is intentional, mark the changelog entry `"breaking": true` and follow the deprecation checklist in `.ai/BREAKING-CHANGES.md`. Keep the old name working, as the policy requires. If it is not a breaking change, ignore this comment.',
    '',
    '**Scope.** The check only looks at removed or renamed public names and at `metaSchema` default changes. It does not check behavior, DOM structure, or CSS property or value changes, so no comment is not an all-clear.',
    '',
    'On past pull requests, about 1 in 7 of these comments pointed at a real break.',
  );

  return lines.join('\n');
}

/**
 * The text that replaces a comment the check no longer stands behind.
 *
 * @param {{ declared: { breakingEntry: boolean } }} result The current `detect()` result.
 * @returns {string} Markdown, without the marker.
 */
export function renderCleared(result) {
  const reason = result.declared.breakingEntry
    ? 'The changelog entry now declares this breaking change.'
    : 'A later push no longer triggers the check.';

  return ['### Possible breaking change', '', reason].join('\n');
}
