import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * Moves the pointer onto an element the way a browser reports it to the Comments plugin.
 *
 * @param {HTMLElement} element The element under the pointer.
 */
function hover(element) {
  element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 5, clientY: 5 }));
}

/**
 * Presses Escape with the focus outside the grid.
 */
function pressEscape() {
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

describe('Comments: Escape and a comment opened by a hover', () => {
  let container;
  let hot;

  beforeAll(() => {
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => null });
  });

  afterAll(() => {
    delete document.elementFromPoint;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: [['a', 'b'], ['c', 'd']],
      comments: { displayDelay: 300 },
      cell: [
        { row: 0, col: 1, comment: { value: 'From the API' } },
        { row: 1, col: 0, comment: { value: 'From a hover' } },
      ],
      licenseKey: TEST_LICENSE_KEY,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Whether the comment editor is on screen.
   *
   * @returns {boolean}
   */
  function isEditorVisible() {
    return document.querySelector('.htComments').style.display === 'block';
  }

  it('hides a comment the hover opened', () => {
    jest.useFakeTimers();
    hover(hot.getCell(1, 0));
    jest.advanceTimersByTime(600);

    expect(isEditorVisible()).toBe(true);

    pressEscape();

    expect(isEditorVisible()).toBe(false);
  });

  it('leaves a comment the API opened when the show a hover armed failed', () => {
    const plugin = hot.getPlugin('comments');
    const showAtCell = jest.spyOn(plugin, 'showAtCell');

    plugin.showAtCell(0, 1);
    jest.useFakeTimers();
    hover(hot.getCell(1, 0));
    // The hovered row leaves the grid inside the display delay, with no pointer event to overrule
    // the armed show: the show runs and fails.
    hot.alter('remove_row', 1);
    jest.advanceTimersByTime(600);

    expect(showAtCell).toHaveBeenLastCalledWith(1, 0);
    expect(showAtCell).toHaveLastReturnedWith(false);
    expect(isEditorVisible()).toBe(true);

    pressEscape();

    expect(isEditorVisible()).toBe(true);
  });

  it('ignores an Escape that ends an IME composition', () => {
    jest.useFakeTimers();
    hover(hot.getCell(1, 0));
    jest.advanceTimersByTime(600);

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, isComposing: true }));

    expect(isEditorVisible()).toBe(true);
  });
});
