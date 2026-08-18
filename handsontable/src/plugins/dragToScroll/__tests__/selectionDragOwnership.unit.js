import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { DragToScroll } from '../dragToScroll';
import { MoveCells } from '../../moveCells';
import { SelectionHandles } from '../../selectionHandles';

describe('DragToScroll selection-drag ownership', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(DragToScroll);
    registerPlugin(MoveCells);
    registerPlugin(SelectionHandles);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid with the selection-interaction plugins enabled.
   *
   * @param {object} [options] Setting overrides.
   * @returns {object} The Handsontable instance.
   */
  function build(options = {}) {
    hot = new Handsontable(container, {
      data: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 'x')),
      moveCells: true,
      selectionHandles: true,
      dragToScroll: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...options,
    });

    return hot;
  }

  /**
   * Builds a left-button mousedown event.
   *
   * @returns {MouseEvent} The event.
   */
  function mouseDown() {
    return new MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10, bubbles: true });
  }

  it('starts auto-scroll for a move drag the MoveCells plugin accepted', () => {
    build();
    hot.selectCells([[1, 1, 3, 3]]);

    hot.runHooks('afterOnSelectionEdgeMouseDown', mouseDown(), 'top');

    // Guards the hook ordering this fix depends on: MoveCells (PLUGIN_PRIORITY 25) must settle its
    // drag state before DragToScroll (100) reads it, otherwise auto-scroll would never engage.
    expect(hot.getPlugin('moveCells').isDragActive()).toBe(true);
    expect(hot.getPlugin('dragToScroll').isListening()).toBe(true);
  });

  it('does not start auto-scroll for a move drag the MoveCells plugin rejected', () => {
    build();
    // No selection at all — MoveCells bails, so there is no drag for auto-scroll to serve.
    hot.deselectCell();

    hot.runHooks('afterOnSelectionEdgeMouseDown', mouseDown(), 'top');

    expect(hot.getPlugin('moveCells').isDragActive()).toBe(false);
    expect(hot.getPlugin('dragToScroll').isListening()).toBe(false);
  });

  it('does not start auto-scroll for a handle drag the SelectionHandles plugin rejected', () => {
    build();
    hot.deselectCell();

    hot.runHooks('afterOnSelectionHandleMouseDown', mouseDown(), 'top');

    expect(hot.getPlugin('selectionHandles').isDragActive()).toBe(false);
    expect(hot.getPlugin('dragToScroll').isListening()).toBe(false);
  });

  it('does not start a move drag on a right-press', () => {
    build();
    hot.selectCells([[1, 1, 3, 3]]);

    const rightPress = new MouseEvent('mousedown', { button: 2, clientX: 10, clientY: 10, bubbles: true });

    hot.runHooks('afterOnSelectionEdgeMouseDown', rightPress, 'top');

    // A right-press opens the context menu; it must not also start (and on release, commit) a move.
    expect(hot.getPlugin('moveCells').isDragActive()).toBe(false);
    expect(hot.getPlugin('dragToScroll').isListening()).toBe(false);
  });

  it('does not start a handle resize on a right-press', () => {
    build();
    hot.selectCells([[1, 1, 3, 3]]);

    const rightPress = new MouseEvent('mousedown', { button: 2, clientX: 10, clientY: 10, bubbles: true });

    hot.runHooks('afterOnSelectionHandleMouseDown', rightPress, 'top');

    expect(hot.getPlugin('selectionHandles').isDragActive()).toBe(false);
    expect(hot.getPlugin('dragToScroll').isListening()).toBe(false);
  });
});
