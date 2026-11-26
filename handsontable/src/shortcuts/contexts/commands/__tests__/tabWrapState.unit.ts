import { createTabWrapState } from '../tabWrapState';
import type { HotInstance } from '../../../../core/types';

type WrapListener = (isActionInterrupted: unknown, newCoords: unknown, isFlipped: boolean) => void;

/**
 * Builds the slice of an instance the wrap state reads: the two wrap hooks, the two auto-wrap
 * settings, the row count, and the active highlight.
 */
function createHot({ autoWrapRow = false, autoWrapCol = false } = {}) {
  const listeners: Record<string, WrapListener[]> = {};
  const state = {
    settings: { autoWrapRow, autoWrapCol },
    rows: 8,
    highlight: { row: 7, col: 0 } as { row: number; col: number } | null,
  };
  const hot = {
    addHook(name: string, listener: WrapListener) {
      listeners[name] = [...(listeners[name] ?? []), listener];
    },
    getSettings: () => state.settings,
    countRows: () => state.rows,
    getSelectedRangeActive: () => (state.highlight ? { highlight: state.highlight } : undefined),
  } as unknown as HotInstance;
  const wrap = (name: 'beforeRowWrap' | 'beforeColumnWrap', isFlipped: boolean) => {
    listeners[name]?.forEach(listener => listener({ value: false }, {}, isFlipped));
  };

  return { hot, state, wrap };
}

describe('createTabWrapState', () => {
  describe('row wrap', () => {
    it('leaves the grid without autoWrapRow, even when the selection moved', () => {
      const { hot, state, wrap } = createHot();
      const wrapState = createTabWrapState(hot);

      wrapState.start();
      wrap('beforeRowWrap', false);
      state.highlight = { row: 1, col: 0 };

      expect(wrapState.leavesGrid()).toBe(true);
      expect(wrapState.isFlippedOffGrid()).toBe(false);
    });

    it('stays in the grid with autoWrapRow when the wrap does not flip', () => {
      const { hot, wrap } = createHot({ autoWrapRow: true });
      const wrapState = createTabWrapState(hot);

      wrapState.start();
      wrap('beforeRowWrap', false);

      expect(wrapState.leavesGrid()).toBe(false);
      expect(wrapState.isFlippedOffGrid()).toBe(false);
    });

    it('leaves the grid with autoWrapRow when the wrap flips, and reports the flip', () => {
      const { hot, wrap } = createHot({ autoWrapRow: true });
      const wrapState = createTabWrapState(hot);

      wrapState.start();
      wrap('beforeRowWrap', true);

      expect(wrapState.leavesGrid()).toBe(true);
      expect(wrapState.isFlippedOffGrid()).toBe(true);
    });

    it('does not report a flip without autoWrapRow', () => {
      const { hot, wrap } = createHot();
      const wrapState = createTabWrapState(hot);

      wrapState.start();
      wrap('beforeRowWrap', true);

      expect(wrapState.leavesGrid()).toBe(true);
      expect(wrapState.isFlippedOffGrid()).toBe(false);
    });
  });

  describe('column wrap without autoWrapCol', () => {
    it('leaves the grid when the selection did not move', () => {
      const { hot, wrap } = createHot();
      const wrapState = createTabWrapState(hot);

      wrapState.start();
      wrap('beforeColumnWrap', false);

      expect(wrapState.leavesGrid()).toBe(true);
      expect(wrapState.isFlippedOffGrid()).toBe(false);
    });

    it('stays in the grid when the selection moved along the last row', () => {
      const { hot, state, wrap } = createHot();
      const wrapState = createTabWrapState(hot);

      state.highlight = { row: 7, col: 1 };
      wrapState.start();
      wrap('beforeColumnWrap', false);
      state.highlight = { row: 7, col: 2 };

      expect(wrapState.leavesGrid()).toBe(false);
    });

    it('stays in the grid when the selection moved into an added row', () => {
      const { hot, state, wrap } = createHot();
      const wrapState = createTabWrapState(hot);

      wrapState.start();
      wrap('beforeColumnWrap', false);
      state.rows = 9;
      state.highlight = { row: 8, col: 0 };

      expect(wrapState.leavesGrid()).toBe(false);
    });

    it('stays in the grid when nothing was selected at the start', () => {
      const { hot, state, wrap } = createHot();
      const wrapState = createTabWrapState(hot);

      state.highlight = null;
      wrapState.start();
      state.highlight = { row: 7, col: 0 };
      wrap('beforeColumnWrap', false);

      expect(wrapState.leavesGrid()).toBe(false);
    });
  });

  describe('column wrap with autoWrapCol', () => {
    it('leaves the grid on a flip with an unchanged row count, and reports the flip', () => {
      const { hot, state, wrap } = createHot({ autoWrapCol: true });
      const wrapState = createTabWrapState(hot);

      state.highlight = { row: 7, col: 4 };
      wrapState.start();
      wrap('beforeColumnWrap', true);
      state.highlight = { row: 0, col: 0 };

      expect(wrapState.leavesGrid()).toBe(true);
      expect(wrapState.isFlippedOffGrid()).toBe(true);
    });

    it('stays in the grid when the wrap does not flip', () => {
      const { hot, state, wrap } = createHot({ autoWrapCol: true });
      const wrapState = createTabWrapState(hot);

      state.highlight = { row: 7, col: 1 };
      wrapState.start();
      wrap('beforeColumnWrap', false);
      state.highlight = { row: 0, col: 2 };

      expect(wrapState.leavesGrid()).toBe(false);
      expect(wrapState.isFlippedOffGrid()).toBe(false);
    });

    it('stays in the grid when the press added a row, even on a flip', () => {
      const { hot, state, wrap } = createHot({ autoWrapCol: true });
      const wrapState = createTabWrapState(hot);

      state.highlight = { row: 7, col: 4 };
      wrapState.start();
      wrap('beforeColumnWrap', true);
      state.rows = 9;
      state.highlight = { row: 8, col: 4 };

      expect(wrapState.leavesGrid()).toBe(false);
      expect(wrapState.isFlippedOffGrid()).toBe(false);
    });

    it('does not use the unmoved-selection rule', () => {
      const { hot, wrap } = createHot({ autoWrapCol: true });
      const wrapState = createTabWrapState(hot);

      wrapState.start();
      wrap('beforeColumnWrap', false);

      expect(wrapState.leavesGrid()).toBe(false);
    });
  });

  it('does not report a column flip without autoWrapCol', () => {
    const { hot, wrap } = createHot();
    const wrapState = createTabWrapState(hot);

    wrapState.start();
    wrap('beforeColumnWrap', true);

    expect(wrapState.isFlippedOffGrid()).toBe(false);
  });

  it('stays in the grid when no wrap happened', () => {
    const { hot, state } = createHot({ autoWrapRow: true, autoWrapCol: true });
    const wrapState = createTabWrapState(hot);

    wrapState.start();
    state.highlight = { row: 7, col: 1 };

    expect(wrapState.leavesGrid()).toBe(false);
    expect(wrapState.isFlippedOffGrid()).toBe(false);
  });

  it('start() clears the wraps of an earlier press and takes a new row count and highlight', () => {
    const { hot, state, wrap } = createHot({ autoWrapRow: true, autoWrapCol: true });
    const wrapState = createTabWrapState(hot);

    wrapState.start();
    wrap('beforeRowWrap', true);
    wrap('beforeColumnWrap', true);
    state.rows = 9;

    wrapState.start();

    expect(wrapState.leavesGrid()).toBe(false);
    expect(wrapState.isFlippedOffGrid()).toBe(false);

    wrap('beforeColumnWrap', true);

    expect(wrapState.leavesGrid()).toBe(true);
  });

  it('reset() clears the wraps', () => {
    const { hot, wrap } = createHot();
    const wrapState = createTabWrapState(hot);

    wrapState.start();
    wrap('beforeRowWrap', false);
    wrap('beforeColumnWrap', false);

    expect(wrapState.leavesGrid()).toBe(true);

    wrapState.reset();

    expect(wrapState.leavesGrid()).toBe(false);
  });
});
