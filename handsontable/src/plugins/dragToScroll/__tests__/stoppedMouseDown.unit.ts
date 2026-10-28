import Handsontable from '../../../base';
import { stopImmediatePropagation } from '../../../helpers/dom/event';
import { registerPlugin } from '../../registry';
import { DragToScroll } from '../dragToScroll';

describe('DragToScroll and a mousedown another listener claimed', () => {
  let container: HTMLElement;
  let hot: InstanceType<typeof Handsontable> | null;

  beforeAll(() => {
    registerPlugin(DragToScroll);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 'x')),
      dragToScroll: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a left-button mousedown event.
   *
   * @returns {MouseEvent}
   */
  function mouseDown(): MouseEvent {
    return new MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 10, bubbles: true });
  }

  /**
   * Runs the `beforeOnCellMouseDown` hook for a body cell the way the core does.
   *
   * @param {MouseEvent} event The mousedown event.
   */
  function pressCell(event: MouseEvent): void {
    hot!.runHooks('beforeOnCellMouseDown', event, hot!._createCellCoords(1, 1), null, {
      row: false,
      column: false,
      cell: false,
    });
  }

  it('starts listening for a cell mousedown nobody claimed', () => {
    pressCell(mouseDown());

    expect(hot!.getPlugin('dragToScroll').isListening()).toBe(true);
  });

  it('does not start listening for a cell mousedown whose immediate propagation was stopped', () => {
    const event = mouseDown();

    stopImmediatePropagation(event);
    pressCell(event);

    expect(hot!.getPlugin('dragToScroll').isListening()).toBe(false);
  });

  it('stays out of the gesture an earlier listener claimed in the same hook', () => {
    // The FormulaBuilder reference pick claims the mousedown from order index -1.
    hot!.addHook('beforeOnCellMouseDown', (event: MouseEvent) => stopImmediatePropagation(event), -1);
    pressCell(mouseDown());

    expect(hot!.getPlugin('dragToScroll').isListening()).toBe(false);
  });

  it('keeps honoring a stopped mousedown after updateSettings re-enables the plugin', () => {
    hot!.updateSettings({ dragToScroll: true });

    const event = mouseDown();

    stopImmediatePropagation(event);
    pressCell(event);

    expect(hot!.getPlugin('dragToScroll').isListening()).toBe(false);

    pressCell(mouseDown());

    expect(hot!.getPlugin('dragToScroll').isListening()).toBe(true);
  });
});
