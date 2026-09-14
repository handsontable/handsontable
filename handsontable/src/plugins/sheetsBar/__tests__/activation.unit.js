import { isKeyboardActivation } from '../ui/activation';

describe('isKeyboardActivation', () => {
  it('reads a click with no pointer detail as a keyboard activation', () => {
    expect(isKeyboardActivation(new MouseEvent('click', { detail: 0 }))).toBe(true);
  });

  it('reads a pointer click as a pointer activation', () => {
    expect(isKeyboardActivation(new MouseEvent('click', { detail: 1 }))).toBe(false);
    expect(isKeyboardActivation(new MouseEvent('click', { detail: 2 }))).toBe(false);
  });

  it('treats a click event constructed without detail as a keyboard activation', () => {
    // `detail` defaults to 0, which is also what Enter and Space report — a synthetic event
    // with no detail is indistinguishable from a keyboard one, and preselecting an item is
    // the safe side of that ambiguity.
    expect(isKeyboardActivation(new MouseEvent('click'))).toBe(true);
  });
});
