/**
 * Try to choose plural form from available phrase propositions.
 *
 * @param {Array} phrasePropositions List of phrases propositions.
 * @param {number} pluralForm Number determining which phrase form should be used.
 *
 * @returns {string|Array} One particular phrase if it's possible, list of unchanged phrase propositions otherwise.
 */
export default function pluralize(phrasePropositions: string | string[], pluralForm?: number): string | string[] {
  const isPluralizable = Array.isArray(phrasePropositions) && Number.isInteger(pluralForm);

  if (isPluralizable) {
    return phrasePropositions[pluralForm as number];
  }

  return phrasePropositions;
}
