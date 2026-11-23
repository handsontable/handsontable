import { armPick } from '../armedPick';

describe('armPick', () => {
  let root: HTMLElement;
  let anchor: HTMLElement;
  let target: HTMLElement;
  let outside: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    anchor = document.createElement('button');
    target = document.createElement('div');
    outside = document.createElement('button');
    root.append(anchor, target);
    document.body.append(root, outside);
  });

  afterEach(() => {
    root.remove();
    outside.remove();
  });

  function arm(onPick: (event: MouseEvent) => void = jest.fn()) {
    const onEnd = jest.fn();
    const pick = armPick({
      doc: document,
      root,
      isAnchor: element => element === anchor,
      onPick,
      onEnd,
    });

    return { pick, onPick, onEnd };
  }

  function press(element: Element, type: string, init: Record<string, unknown> = {}) {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, composed: true, ...init });
    const reachedTarget = jest.fn();

    element.addEventListener(type, reachedTarget);
    element.dispatchEvent(event);

    return { event, reachedTarget };
  }

  it('should pick the target with the next click and end', () => {
    const { onPick, onEnd } = arm();

    press(target, 'pointerdown');
    target.click();

    expect(onPick).toHaveBeenCalledTimes(1);
    expect((onPick as jest.Mock).mock.calls[0][0].target).toBe(target);
    expect(onEnd).toHaveBeenCalledWith('picked');
  });

  it('should stop listening after it ended', () => {
    const { onPick } = arm();

    press(target, 'pointerdown');
    target.click();
    press(target, 'pointerdown');
    target.click();

    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('should end even when the pick throws, so nothing stays armed', () => {
    const { onEnd } = arm(() => {
      throw new Error('the commit failed');
    });

    // the browser reports an error thrown by a listener instead of passing it on to the caller of `click()`
    const silence = (event: ErrorEvent) => event.preventDefault();

    window.addEventListener('error', silence);
    press(target, 'pointerdown');
    target.click();
    window.removeEventListener('error', silence);

    expect(onEnd).toHaveBeenCalledWith('picked');

    const { event } = press(target, 'pointerdown');

    expect(event.defaultPrevented).toBe(false);
  });

  it('should not pick with a click whose press it did not see, such as the click that armed it', () => {
    const { onPick, onEnd } = arm();

    target.click();

    expect(onPick).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('should keep the press that comes before the click away from the page', () => {
    arm();

    ['pointerdown', 'mousedown'].forEach((type) => {
      const { event, reachedTarget } = press(target, type);

      expect(event.defaultPrevented).toBe(true);
      expect(reachedTarget).not.toHaveBeenCalled();
    });
  });

  it('should keep the taps that pick away from the grid, and leave their default alone', () => {
    arm();

    ['touchstart', 'touchend'].forEach((type) => {
      const { event, reachedTarget } = press(target, type);

      expect(reachedTarget).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });
  });

  it('should leave a press and a click on a control that can arm it alone', () => {
    const { onPick, onEnd } = arm();
    const { event, reachedTarget } = press(anchor, 'pointerdown');

    anchor.click();

    expect(event.defaultPrevented).toBe(false);
    expect(reachedTarget).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('should end on a press outside the grid without taking it from the page', () => {
    const { onPick, onEnd } = arm();
    const { event, reachedTarget } = press(outside, 'pointerdown');

    outside.click();

    expect(onEnd).toHaveBeenCalledWith('abandoned');
    expect(onPick).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    expect(reachedTarget).toHaveBeenCalledTimes(1);
  });

  it('should not take a right press inside the grid, and not count it as the press of a pick', () => {
    const { onPick, onEnd } = arm();
    const { event, reachedTarget } = press(target, 'pointerdown', { button: 2 });

    target.click();

    expect(event.defaultPrevented).toBe(false);
    expect(reachedTarget).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('should forget a press the browser took over, such as a touch that scrolls', () => {
    const { onPick } = arm();

    press(target, 'pointerdown');
    document.dispatchEvent(new Event('pointercancel', { bubbles: true }));
    target.click();

    expect(onPick).not.toHaveBeenCalled();
  });

  it('should end on Escape without picking, and let the page have the key', () => {
    const { onPick, onEnd } = arm();
    const reachedPage = jest.fn();
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });

    document.body.addEventListener('keydown', reachedPage);
    target.dispatchEvent(event);
    document.body.removeEventListener('keydown', reachedPage);

    expect(onEnd).toHaveBeenCalledWith('escape');
    expect(onPick).not.toHaveBeenCalled();
    expect(reachedPage).toHaveBeenCalledTimes(1);
  });

  it('should ignore the other keys', () => {
    const { onEnd } = arm();

    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(onEnd).not.toHaveBeenCalled();
  });

  it('should end as abandoned when the caller cancels, once', () => {
    const { pick, onPick, onEnd } = arm();

    pick.cancel();
    pick.cancel();
    press(target, 'pointerdown');
    target.click();

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledWith('abandoned');
    expect(onPick).not.toHaveBeenCalled();
  });
});
