import type { FilterKind, VersionEntry } from './types';

/**
 * Whether an entry belongs to the tab the reader picked. Drives both the tab
 * counts and the compact list.
 */
export function matchesFilter(entry: VersionEntry, filter: FilterKind): boolean {
  switch (filter) {
    case 'all': return true;
    case 'breaking': return entry.breaking;
    case 'deprecated': return entry.category === 'deprecated' && !entry.breaking;
    case 'new': return entry.category === 'added' && !entry.breaking;
    case 'fixed': return entry.category === 'fixed' && !entry.breaking;
  }
}

// Every highlight is also surfaced on the New tab, so a release's headline
// features stay visible on the default landing view whichever changelog section
// they were filed under. An author picks at most five highlights per release
// (see docs/scripts/validate-version-highlights.mjs), and the section a feature
// lands in is an implementation detail of the changelog: 18.1's Shadow DOM
// support sits under Fixed and its single-pass rendering under Changed. Set this
// to false to revert to showing a highlight only on All and on the tab matching
// its own category.
export const SHOW_HIGHLIGHTS_ON_NEW = true;

/**
 * Whether a highlighted entry renders as a featured card under the active
 * filter. A highlight always shows on All and on the tab matching its own
 * category (a deprecated highlight on Deprecated, a breaking one on Breaking,
 * and so on), so it never leaks onto an unrelated tab. The one exception is the
 * revertable rule above that also promotes every highlight onto New.
 */
export function isFeatured(entry: VersionEntry, filter: FilterKind): boolean {
  if (!entry.highlighted) return false;
  if (filter === 'all') return true;
  if (matchesFilter(entry, filter)) return true;
  return SHOW_HIGHLIGHTS_ON_NEW && filter === 'new';
}

/**
 * Splits one release's entries into featured cards and compact rows.
 *
 * One PR can be cited by two changelog bullets in different sections (18.1's
 * #12951 is both an `added` hook and a `changed` render path; 16.1's #11790 is
 * both `added` and `deprecated`). Both bullets carry the same highlight, so only
 * the first renders as a featured card - which also means the card's pill comes
 * from the section that appears first in the changelog. The other bullet keeps
 * its place in the compact list, but only on a tab its own category belongs to,
 * so a promoted highlight does not drag a second bullet onto the New tab.
 *
 * Expects entries already narrowed by `isFeatured(e, filter) || matchesFilter(e,
 * filter)`, which is what the page's visible set holds. An entry outside that
 * set is dropped rather than listed.
 */
export function partitionEntries(
  entries: VersionEntry[],
  filter: FilterKind,
): { featured: VersionEntry[]; compact: VersionEntry[] } {
  const featured: VersionEntry[] = [];
  const compact: VersionEntry[] = [];
  const featuredPrNumbers = new Set<number>();

  for (const entry of entries) {
    const alreadyFeatured = entry.prNumber !== null && featuredPrNumbers.has(entry.prNumber);

    if (isFeatured(entry, filter) && !alreadyFeatured) {
      if (entry.prNumber !== null) featuredPrNumbers.add(entry.prNumber);
      featured.push(entry);
    } else if (matchesFilter(entry, filter)) {
      compact.push(entry);
    }
  }

  return { featured, compact };
}
