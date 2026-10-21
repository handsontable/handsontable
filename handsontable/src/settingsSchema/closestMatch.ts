/**
 * Counts the single-character insertions, deletions, and substitutions that turn one string into
 * the other (the Levenshtein distance). Compares UTF-16 code units, which is enough for the
 * identifiers it is meant for.
 *
 * @param {string} a The first string.
 * @param {string} b The second string.
 * @returns {number} The edit distance.
 */
export function getEditDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];

    for (let j = 1; j <= b.length; j += 1) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);

      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution);
    }

    previous = current;
  }

  return previous[b.length];
}

/**
 * Finds the candidate a misspelled word most likely meant, for a "did you mean" hint. A candidate
 * that differs in letter case only wins outright. Otherwise the candidate with the smallest
 * edit distance wins, as long as the distance is at most a third of the word's length (and at
 * least 2), so an unrelated word gets no suggestion. Of two equally close candidates, one that
 * starts with the word wins (`columnSort` means `columnSorting` rather than `columns`), then the
 * first one listed.
 *
 * @param {string} word The misspelled word.
 * @param {string[]} candidates The words to choose from.
 * @returns {string|null} The closest candidate, or `null` when none is close enough.
 */
export function findClosestMatch(word: string, candidates: string[]): string | null {
  const lowerWord = word.toLowerCase();
  const sameLetters = candidates.find(candidate => candidate.toLowerCase() === lowerWord);

  if (sameLetters !== undefined) {
    return sameLetters;
  }

  const maxDistance = Math.max(2, Math.floor(word.length / 3));
  let closest: string | null = null;
  let closestDistance = maxDistance + 1;
  let closestExtendsWord = false;

  candidates.forEach((candidate) => {
    const lowerCandidate = candidate.toLowerCase();
    const distance = getEditDistance(lowerWord, lowerCandidate);
    const extendsWord = lowerCandidate.startsWith(lowerWord);

    if (distance < closestDistance || (distance === closestDistance && extendsWord && !closestExtendsWord)) {
      closest = candidate;
      closestDistance = distance;
      closestExtendsWord = extendsWord;
    }
  });

  return closest;
}
