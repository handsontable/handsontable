import substituteVariables from 'handsontable/i18n/phraseFormatters/substituteVariables';

describe('i18n substituteVariables function', () => {
  it('should return substituted phrase when handling just one phrase proposition', () => {
    const phraseProposition = 'hello [name]';

    expect(substituteVariables(phraseProposition, { name: 'Tim' })).toEqual('hello Tim');
  });

  it('should return substituted phrases propositions when handling array of phrase propositions', () => {
    const phrasePropositions = ['hello [name]', 'hi [name] [surname]'];

    expect(substituteVariables(phrasePropositions, { name: 'Tim', surname: 'Cook' }))
      .toEqual(['hello Tim', 'hi Tim Cook']);
  });

  it('should return phrase propositions with removed variables when variables do not exist in second function argument', () => {
    const phraseProposition = 'hello';
    const phraseProposition2 = 'hello [secondName]';
    const phrasePropositions = ['hello'];
    const phrasePropositions2 = ['hello [secondName]'];

    expect(substituteVariables(phraseProposition, { name: 'Tim', surname: 'Cook' })).toEqual('hello');
    expect(substituteVariables(phraseProposition2, { name: 'Tim', surname: 'Cook' })).toEqual('hello ');

    expect(substituteVariables(phrasePropositions, { name: 'Tim', surname: 'Cook' })).toEqual(['hello']);
    expect(substituteVariables(phrasePropositions2, { name: 'Tim', surname: 'Cook' })).toEqual(['hello ']);
  });

  it('should return phrase propositions with removed variables when second function argument is not defined', () => {
    const phraseProposition = 'hello';
    const phraseProposition2 = 'hello [secondName]';
    const phrasePropositions = ['hello'];
    const phrasePropositions2 = ['hello [secondName]'];

    expect(substituteVariables(phraseProposition)).toEqual('hello');
    expect(substituteVariables(phraseProposition2)).toEqual('hello ');
    expect(substituteVariables(phrasePropositions)).toEqual(['hello']);
    expect(substituteVariables(phrasePropositions2)).toEqual(['hello ']);
  });
});
