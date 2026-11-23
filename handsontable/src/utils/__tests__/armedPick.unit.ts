import { armPick } from '../armedPick';

describe('armPick', () => {
  let anchor: HTMLElement;
  let target: HTMLElement;

  beforeEach(() => {
    anchor = document.createElement('button');
    target = document.createElement('div');
    document.body.append(anchor, target);
  });

  afterEach(() => {
    anchor.remove();
    target.remove();
  });

  function arm() {
    const onPick = jest.fn();
    const onEnd = jest.fn();
    const pick = armPick({
      doc: document,
      isAnchor: element => element === anchor,
      onPick,
      onEnd,
    });

    return { pick, onPick, onEnd };
  }

  function press(element: Element, type: 'pointerdown' | 'mousedown') {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, composed: true });
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
    expect(onPick.mock.calls[0][0].target).toBe(target);
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

  it('should not pick with a click whose press it did not see, such as the click that armed it', () => {
    const { onPick, onEnd } = arm();

    target.click();

    expect(onPick).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('should keep the press that comes before the click away from the page', () => {
    arm();

    ['pointerdown', 'mousedown'].forEach((type) => {
      const { event, reachedTarget } = press(target, type as 'pointerdown' | 'mousedown');

      expect(event.defaultPrevented).toBe(true);
      expect(reachedTarget).not.toHaveBeenCalled();
    });
  });

  it('should leave a press and a click on the control that armed it alone', () => {
    const { onPick, onEnd } = arm();
    const { event, reachedTarget } = press(anchor, 'pointerdown');

    anchor.click();

    expect(event.defaultPrevented).toBe(false);
    expect(reachedTarget).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('should end on Escape without picking, and keep Escape from the page', () => {
    const { onPick, onEnd } = arm();
    const reachedPage = jest.fn();
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });

    document.body.addEventListener('keydown', reachedPage);
    target.dispatchEvent(event);
    document.body.removeEventListener('keydown', reachedPage);

    expect(onEnd).toHaveBeenCalledWith('escape');
    expect(onPick).not.toHaveBeenCalled();
    expect(reachedPage).not.toHaveBeenCalled();
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
    target.click();

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledWith('abandoned');
    expect(onPick).not.toHaveBeenCalled();
  });
});
