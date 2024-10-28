import pluralize from 'handsontable/i18n/phraseFormatters/pluralize';

describe('i18n pluralize function', () => {
  it('should return selected form of phrase when handling array of phrase propositions', () => {
    const phrasePropositions = ['first', 'second', 'third'];

    expect(pluralize(phrasePropositions, 0)).toEqual('first');
    expect(pluralize(phrasePropositions, 1)).toEqual('second');
    expect(pluralize(phrasePropositions, 2)).toEqual('third');
  });

  it('should return untouched phrase when handling one phrase proposition', () => {
    const phraseProposition = 'first';

    expect(pluralize(phraseProposition)).toEqual(phraseProposition);
    expect(pluralize(phraseProposition, 2)).toEqual(phraseProposition);
  });

  it('should return untouched array of phrase propositions when function is called without the expected second parameter', () => {
    const phrasePropositions = ['first', 'second', 'third'];

    expect(pluralize(phrasePropositions, undefined)).toEqual(phrasePropositions);
    expect(pluralize(phrasePropositions, NaN)).toEqual(phrasePropositions);
    expect(pluralize(phrasePropositions, null)).toEqual(phrasePropositions);
    expect(pluralize(phrasePropositions, 1.2)).toEqual(phrasePropositions);
  });

  it('should return untouched first parameter when function is handling phrase propositions which are not a list', () => {
    expect(pluralize(NaN)).toEqual(NaN);
    expect(pluralize(NaN, 1)).toEqual(NaN);

    expect(pluralize(undefined)).toEqual(undefined);
    expect(pluralize(undefined, 1)).toEqual(undefined);

    expect(pluralize(0)).toEqual(0);
    expect(pluralize(0, 1)).toEqual(0);

    expect(pluralize(null)).toEqual(null);
    expect(pluralize(null, 1)).toEqual(null);

    expect(pluralize('', 1)).toEqual('');
    expect(pluralize('', 1)).toEqual('');
  });
});
