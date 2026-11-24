import EventManager from 'handsontable/eventManager';
import { armPressRelease, getCoordsWithinGrid } from 'handsontable/helpers/dom/pointerRelease';

type Grid = Parameters<typeof getCoordsWithinGrid>[0];

/**
 * Dispatches a `mouseup` on an element.
 *
 * @param target The element the release lands on.
 * @param button The button released.
 */
function release(target: Element | Document, button = 0) {
  target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button }));
}

describe('armPressRelease', () => {
  let control: HTMLElement;
  let elsewhere: HTMLElement;
  let eventManager: EventManager;
  let onRelease: jest.Mock;
  let onCancel: jest.Mock;

  /**
   * Arms a press on the left button.
   *
   * @returns The disposer.
   */
  function arm() {
    return armPressRelease(eventManager, document, new MouseEvent('mousedown', { button: 0 }), {
      isSame: target => target === control,
      onRelease,
      onCancel,
    });
  }

  beforeEach(() => {
    control = document.body.appendChild(document.createElement('button'));
    elsewhere = document.body.appendChild(document.createElement('div'));
    eventManager = new EventManager();
    onRelease = jest.fn();
    onCancel = jest.fn();
  });

  afterEach(() => {
    eventManager.destroy();
    control.remove();
    elsewhere.remove();
  });

  it('does nothing until the release', () => {
    arm();

    expect(onRelease).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('runs onRelease once when the release lands on the same control', () => {
    arm();
    release(control);
    release(control);

    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels when the release lands elsewhere', () => {
    arm();
    release(elsewhere);
    release(control);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('cancels when the release lands outside any element', () => {
    arm();
    release(document);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('ignores the release of another button', () => {
    arm();
    release(elsewhere, 2);

    expect(onCancel).not.toHaveBeenCalled();

    release(control);

    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it('still sees a release a bubbling listener stops', () => {
    elsewhere.addEventListener('mouseup', event => event.stopPropagation());
    arm();
    release(elsewhere);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels on Escape', () => {
    arm();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    release(control);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('cancels on the window losing the focus', () => {
    arm();
    window.dispatchEvent(new Event('blur'));
    release(control);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('cancels on a browser drag start', () => {
    arm();
    document.dispatchEvent(new Event('dragstart'));
    release(control);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('drops the press without a callback when the disposer runs', () => {
    const dispose = arm();

    dispose();
    release(control);
    release(elsewhere);

    expect(onRelease).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('is removed with the event manager', () => {
    arm();
    eventManager.destroy();
    release(control);

    expect(onRelease).not.toHaveBeenCalled();
  });
});

describe('getCoordsWithinGrid', () => {
  it('answers the coordinates of a cell inside the grid', () => {
    const root = document.createElement('div');
    const cell = root.appendChild(document.createElement('td'));
    const getCoords = jest.fn(() => ({ row: 1, col: 2 }));

    expect(getCoordsWithinGrid({ rootElement: root, getCoords } as unknown as Grid, cell)).toEqual({ row: 1, col: 2 });
    expect(getCoords).toHaveBeenCalledWith(cell);
  });

  it('answers null for a cell of another grid, without reading its coordinates', () => {
    const root = document.createElement('div');
    const other = document.createElement('div').appendChild(document.createElement('td'));
    const getCoords = jest.fn(() => ({ row: 1, col: 2 }));

    expect(getCoordsWithinGrid({ rootElement: root, getCoords } as unknown as Grid, other)).toBeNull();
    expect(getCoords).not.toHaveBeenCalled();
  });

  it('answers null without a cell', () => {
    const root = document.createElement('div');

    expect(getCoordsWithinGrid({ rootElement: root, getCoords: jest.fn() } as unknown as Grid, null)).toBeNull();
  });
});
