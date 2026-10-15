import { showNativePicker, hideNativePicker } from '../showNativePicker';

describe('showNativePicker', () => {
  const makeInput = () => {
    const input = document.createElement('input');

    input.showPicker = jest.fn();

    return input;
  };

  it('shows the picker when a double-click opened the editor', () => {
    const input = makeInput();

    showNativePicker(input, new MouseEvent('dblclick'));

    expect(input.showPicker).toHaveBeenCalledTimes(1);
  });

  it('shows the picker when no event opened the editor (the editor API)', () => {
    const input = makeInput();

    showNativePicker(input);

    expect(input.showPicker).toHaveBeenCalledTimes(1);
  });

  it('keeps the picker closed when a key opened the editor', () => {
    const input = makeInput();

    showNativePicker(input, new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(input.showPicker).not.toHaveBeenCalled();
  });

  it('keeps the picker closed for a key event that carries no KeyboardEvent instance (another window)', () => {
    const input = makeInput();

    showNativePicker(input, { type: 'keydown' });

    expect(input.showPicker).not.toHaveBeenCalled();
  });

  it('swallows the error of a missing user gesture', () => {
    const input = makeInput();

    input.showPicker = jest.fn(() => {
      throw new Error('showPicker() requires a user gesture');
    });

    expect(() => showNativePicker(input, new MouseEvent('dblclick'))).not.toThrow();
  });
});

describe('hideNativePicker', () => {
  const makeSetup = (matches) => {
    const input = document.createElement('input');
    const focusOnHighlightedCell = jest.fn();
    const hot = {
      rootDocument: document,
      getFocusManager: () => ({ focusOnHighlightedCell }),
    };

    document.body.appendChild(input);
    input.focus();
    input.matches = jest.fn(matches);
    input.blur = jest.fn();

    return { input, hot, focusOnHighlightedCell };
  };

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('blurs the focused input while its picker is open and refocuses the highlighted cell', () => {
    const { input, hot, focusOnHighlightedCell } = makeSetup(() => true);

    hideNativePicker(hot, input);

    expect(input.blur).toHaveBeenCalledTimes(1);
    expect(focusOnHighlightedCell).toHaveBeenCalledTimes(1);
  });

  it('leaves the input alone when no picker is open', () => {
    const { input, hot, focusOnHighlightedCell } = makeSetup(() => false);

    hideNativePicker(hot, input);

    expect(input.blur).not.toHaveBeenCalled();
    expect(focusOnHighlightedCell).not.toHaveBeenCalled();
  });

  it('leaves the input alone when it does not hold the focus', () => {
    const { hot, focusOnHighlightedCell } = makeSetup(() => true);
    const other = document.createElement('input');

    other.matches = jest.fn(() => true);
    other.blur = jest.fn();
    document.body.appendChild(other);

    hideNativePicker(hot, other);

    expect(other.blur).not.toHaveBeenCalled();
    expect(focusOnHighlightedCell).not.toHaveBeenCalled();
  });

  it('assumes the picker is open in an engine without the `:open` selector', () => {
    const { input, hot } = makeSetup(() => {
      throw new SyntaxError('not a valid selector');
    });

    hideNativePicker(hot, input);

    expect(input.blur).toHaveBeenCalledTimes(1);
  });
});
