import { toSpokenErrorMessage } from '../formulaBuilder';

describe('toSpokenErrorMessage', () => {
  it('keeps the code and the first sentence', () => {
    expect(toSpokenErrorMessage('#ERROR! — Parsing error. Expected one of:\nNumberLiteral'))
      .toBe('#ERROR! — Parsing error.');
  });

  it('keeps a bare code', () => {
    expect(toSpokenErrorMessage('#DIV/0!')).toBe('#DIV/0!');
  });

  it('cuts a long sentence at the last space inside the limit', () => {
    const spoken = toSpokenErrorMessage(`#VALUE! — ${'word '.repeat(40)}`);

    expect(spoken.endsWith('word…')).toBe(true);
    expect(spoken.length).toBeLessThanOrEqual(121);
  });

  it('cuts a long run with no space in the message itself at the limit, not at the separator', () => {
    const spoken = toSpokenErrorMessage(`#VALUE! — ${'漢'.repeat(160)}`);

    expect(spoken).toBe(`#VALUE! — ${'漢'.repeat(110)}…`);
  });
});
