import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { SheetsBar } from '../sheetsBar';

registerPlugin(SheetsBar);

/**
 * Builds a fresh workbook: a removal splices the configured array in place.
 *
 * @returns {object[]}
 */
function createSheets() {
  return [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }];
}

/**
 * Lays the tabs out in jsdom, which computes no layout: each element sits 50px after its
 * previous sibling, so a move gives the tabs somewhere to slide from.
 */
function layOutSiblings() {
  jest.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function() {
    return this.parentElement === null ? 0 : Array.prototype.indexOf.call(this.parentElement.children, this) * 50;
  });
  jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(() => 50);
}

/**
 * Tracks every timeout the window schedules from now on, and which of them are still pending,
 * so a test can tell the timeouts the bar's motion started apart from the ones it cleared or
 * that ran.
 *
 * @returns {{ pending: Set<number>, ran: number[], startedSince: Function }}
 */
function trackTimeouts() {
  const pending = new Set();
  const ran = [];
  const started = [];
  const nativeSetTimeout = window.setTimeout;
  const nativeClearTimeout = window.clearTimeout;

  jest.spyOn(window, 'setTimeout').mockImplementation((callback, delay, ...args) => {
    let id = null;

    id = nativeSetTimeout.call(window, () => {
      pending.delete(id);
      ran.push(id);
      callback(...args);
    }, delay);
    pending.add(id);
    started.push(id);

    return id;
  });
  jest.spyOn(window, 'clearTimeout').mockImplementation((id) => {
    pending.delete(id);
    nativeClearTimeout.call(window, id);
  });

  return {
    pending,
    ran,
    startedSince: mark => started.slice(mark),
    mark: () => started.length,
  };
}

/**
 * Builds a grid whose sheets bar animates: the theme transition token is set on the root
 * element, and the motion gate is let open by running its two animation frames.
 *
 * @returns {Handsontable}
 */
function createAnimatedGrid() {
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    licenseKey: 'non-commercial-and-evaluation',
    sheetsBar: { sheets: createSheets() },
  });

  hot.rootElement.style.setProperty('--ht-table-transition', '150ms');
  jest.advanceTimersByTime(50);

  return hot;
}

/**
 * Starts every kind of motion the bar runs: a marker slide, a tab slide, a leaving copy, and a
 * tab entrance. The entrance comes last, because a tab slide ends the entrances running.
 *
 * @param {Handsontable} hot The grid.
 */
function startEveryMotion(hot) {
  const plugin = hot.getPlugin('sheetsBar');

  plugin.setActiveSheet('Beta');
  plugin.moveSheetToIndex(plugin.getSheets()[0].id, 2);
  plugin.removeSheet(plugin.getSheets().find(sheet => sheet.name === 'Gamma').id);
  plugin.addSheet('Delta');
}

describe('SheetsBar motion timeouts', () => {
  let hot;

  beforeEach(() => {
    jest.useFakeTimers();
    layOutSiblings();
  });

  afterEach(() => {
    if (hot && !hot.isDestroyed) {
      hot.destroy();
    }

    hot = null;
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('leaves no entry in `hot.timeouts` however many animated switches run', () => {
    hot = createAnimatedGrid();

    const plugin = hot.getPlugin('sheetsBar');
    const before = hot.timeouts.length;

    plugin.setActiveSheet('Beta');

    expect(document.querySelector('.ht-sheets-bar__tab-indicator')).not.toBeNull();

    for (let i = 0; i < 20; i += 1) {
      plugin.setActiveSheet(i % 2 === 0 ? 'Gamma' : 'Alpha');
      jest.advanceTimersByTime(1000);
    }

    expect(hot.timeouts.length).toBe(before);
  });

  it('clears every pending motion timeout when the grid is destroyed mid-slide', () => {
    hot = createAnimatedGrid();

    const timeouts = trackTimeouts();
    const mark = timeouts.mark();

    startEveryMotion(hot);

    const motion = timeouts.startedSince(mark);

    expect(motion.filter(id => timeouts.pending.has(id)).length).toBeGreaterThanOrEqual(4);

    hot.destroy();

    expect(motion.filter(id => timeouts.pending.has(id))).toEqual([]);

    jest.advanceTimersByTime(5000);

    expect(motion.filter(id => timeouts.ran.includes(id))).toEqual([]);
  });

  it('clears every pending motion timeout when the bar is turned off mid-slide', () => {
    hot = createAnimatedGrid();

    const timeouts = trackTimeouts();
    const mark = timeouts.mark();

    startEveryMotion(hot);

    const motion = timeouts.startedSince(mark);

    expect(motion.filter(id => timeouts.pending.has(id)).length).toBeGreaterThanOrEqual(4);

    hot.updateSettings({ sheetsBar: false });

    expect(motion.filter(id => timeouts.pending.has(id))).toEqual([]);

    jest.advanceTimersByTime(5000);

    expect(motion.filter(id => timeouts.ran.includes(id))).toEqual([]);
  });

  it('keeps the running motion\'s timeouts when the same settings are sent again', () => {
    hot = createAnimatedGrid();

    const timeouts = trackTimeouts();
    const mark = timeouts.mark();

    startEveryMotion(hot);

    const motion = timeouts.startedSince(mark).filter(id => timeouts.pending.has(id));
    const resentMark = timeouts.mark();

    hot.updateSettings({ sheetsBar: { sheets: hot.getSettings().sheetsBar.sheets } });

    expect(motion.filter(id => timeouts.pending.has(id))).toEqual(motion);
    expect(timeouts.startedSince(resentMark)).toEqual([]);

    hot.destroy();
    jest.advanceTimersByTime(5000);

    expect(timeouts.startedSince(mark).filter(id => timeouts.ran.includes(id))).toEqual([]);
  });

  it('hands the motion over on a workbook-preserving update that rebuilds the bar and clears the old strip\'s timeouts', () => {
    hot = createAnimatedGrid();

    const timeouts = trackTimeouts();
    const mark = timeouts.mark();

    startEveryMotion(hot);

    const motion = timeouts.startedSince(mark);

    expect(motion.filter(id => timeouts.pending.has(id)).length).toBeGreaterThanOrEqual(4);

    const handedOverMark = timeouts.mark();

    hot.updateSettings({
      sheetsBar: {
        sheets: hot.getSettings().sheetsBar.sheets,
        animation: { switch: true, add: true, remove: true, move: true },
      },
    });

    expect(motion.filter(id => timeouts.pending.has(id))).toEqual([]);
    expect(timeouts.startedSince(handedOverMark).filter(id => timeouts.pending.has(id)).length)
      .toBeGreaterThan(0);
    expect(document.querySelector('.ht-sheets-bar__tab-indicator')).not.toBeNull();

    hot.destroy();
    jest.advanceTimersByTime(5000);

    expect(timeouts.startedSince(mark).filter(id => timeouts.ran.includes(id))).toEqual([]);
  });
});
