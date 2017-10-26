import pluralize from 'handsontable/i18n/phraseFormatters/pluralize';

describe('i18n pluralize function', () => {
  it('should return selected form of phrase when handling array of phrase propositions', () => {
    const phrasePropositions = ['first', 'second', 'third'];

    expect(pluralize(phrasePropositions, 0)).toEqual('first');
    expect(pluralize(phrasePropositions, 1)).toEqual('second');
    expect(pluralize(phrasePropositions, 2)).toEqual('third');
  });

  it('should return untouched array of phrase propositions when function is called without second parameter', () => {
    const phrasePropositions = ['first', 'second', 'third'];

    expect(pluralize(phrasePropositions)).toEqual(phrasePropositions);
    expect(pluralize(phrasePropositions, undefined)).toEqual(phrasePropositions);
  });

  it('should return untouched phrase when handling one phrase proposition', () => {
    const phraseProposition = 'first';

    expect(pluralize(phraseProposition)).toEqual(phraseProposition);
    expect(pluralize(phraseProposition, 2)).toEqual(phraseProposition);
  });
});
