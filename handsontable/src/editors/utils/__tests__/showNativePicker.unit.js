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
  it('blurs the input while its picker is open', () => {
    const input = document.createElement('input');

    input.matches = jest.fn(() => true);
    input.blur = jest.fn();

    hideNativePicker(input);

    expect(input.blur).toHaveBeenCalledTimes(1);
  });

  it('leaves the input alone when no picker is open', () => {
    const input = document.createElement('input');

    input.matches = jest.fn(() => false);
    input.blur = jest.fn();

    hideNativePicker(input);

    expect(input.blur).not.toHaveBeenCalled();
  });

  it('swallows the error of an engine without the `:open` selector', () => {
    const input = document.createElement('input');

    input.matches = jest.fn(() => {
      throw new SyntaxError('not a valid selector');
    });

    expect(() => hideNativePicker(input)).not.toThrow();
  });
});
