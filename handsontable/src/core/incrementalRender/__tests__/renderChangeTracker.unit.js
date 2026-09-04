import {
  RenderChangeTracker,
  CELL_RENDER_VERSION_PROPERTY,
  getCellRenderVersion,
  markCellMetaChanged,
} from '../renderChangeTracker';

describe('RenderChangeTracker', () => {
  it('should start at epoch 0 and advance by one per invalidation', () => {
    const tracker = new RenderChangeTracker();

    expect(tracker.epoch).toBe(0);

    tracker.markAllChanged();
    tracker.markAllChanged();

    expect(tracker.epoch).toBe(2);
  });
});

describe('cell render version', () => {
  it('should read a never-written meta object as version 0', () => {
    expect(getCellRenderVersion({})).toBe(0);
    expect(getCellRenderVersion({ readOnly: true })).toBe(0);
  });

  it('should advance the version on the meta object itself, as an own property', () => {
    const columnMeta = { readOnly: true };
    const cellMeta = Object.create(columnMeta);

    markCellMetaChanged(cellMeta);
    markCellMetaChanged(cellMeta);

    expect(getCellRenderVersion(cellMeta)).toBe(2);
    expect(Object.prototype.hasOwnProperty.call(cellMeta, CELL_RENDER_VERSION_PROPERTY)).toBe(true);
    expect(getCellRenderVersion(columnMeta)).toBe(0);
  });

  it('should not share the version between cells that inherit from the same column meta', () => {
    const columnMeta = {};
    const first = Object.create(columnMeta);
    const second = Object.create(columnMeta);

    markCellMetaChanged(first);

    expect(getCellRenderVersion(first)).toBe(1);
    expect(getCellRenderVersion(second)).toBe(0);
  });
});
