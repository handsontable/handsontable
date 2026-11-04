import { isPageTextSelectionKept, keepPageTextSelection } from '../pageTextSelection';

describe('pageTextSelection', () => {
  it('reports a press as kept only after it was marked', () => {
    const marked = new MouseEvent('mousedown');
    const other = new MouseEvent('mousedown');

    keepPageTextSelection(marked);

    expect(isPageTextSelectionKept(marked)).toBe(true);
    expect(isPageTextSelectionKept(other)).toBe(false);
  });

  it('does not treat a press another listener stopped as kept', () => {
    const event = new MouseEvent('mousedown') as MouseEvent & { isImmediatePropagationEnabled: boolean };

    event.isImmediatePropagationEnabled = false;

    expect(isPageTextSelectionKept(event)).toBe(false);
  });
});
