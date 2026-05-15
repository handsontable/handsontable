export function mergeEntriesWithHighlights(autoEntries, highlightFiles) {
  const byPr = new Map();
  for (const file of highlightFiles) {
    for (const h of file.data.highlighted) {
      byPr.set(h.prNumber, h);
    }
  }

  return autoEntries.map((entry) => {
    if (entry.prNumber === null) return { ...entry, highlighted: false };
    const h = byPr.get(entry.prNumber);
    if (!h) return { ...entry, highlighted: false };
    return {
      ...entry,
      highlighted: true,
      tagline: h.tagline,
      whyItMatters: h.whyItMatters,
      codeBefore: h.codeBefore,
      codeAfter: h.codeAfter,
      migrationAnchor: h.migrationAnchor,
    };
  });
}

export function buildReleaseSummaries(autoEntries, currentVersion) {
  const seen = new Map();
  for (const entry of autoEntries) {
    if (!entry.version.endsWith('.0')) continue;
    const [major, minor] = entry.version.split('.').map(Number);
    const key = `${major}.${minor}`;
    if (!seen.has(key)) {
      seen.set(key, {
        version: key,
        releaseDate: entry.releaseDate,
        major,
        minor,
      });
    }
  }

  const currentMinor = currentVersion
    ? currentVersion.split('.').slice(0, 2).join('.')
    : null;

  return Array.from(seen.values())
    .sort((a, b) => (b.major - a.major) || (b.minor - a.minor))
    .map((r) => ({ ...r, isCurrent: r.version === currentMinor }));
}
