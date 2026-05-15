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
