import type { CellProperties } from '../../settings';

/**
 * The `renderMode` value under which a cell is painted on every draw (today's behavior).
 */
export const RENDER_MODE_ALWAYS = 'always';
/**
 * The `renderMode` value under which a cell is painted only when what it shows may have changed.
 */
export const RENDER_MODE_ON_CHANGE = 'onChange';

/**
 * The name of the cell meta property that counts the writes made to the cell's meta object. It is a
 * plain own property, so reading it off a meta object the caller already holds costs nothing on the
 * `LazyFactoryMap` read path. It is written on every `setMeta`/`removeMeta`/`updateMeta` of the
 * cell, on the validation writes, and by `Core#markCellChanged`. A meta object rebuilt after
 * eviction starts over from `undefined`, which the paint decision reads as "changed" – the safe
 * direction.
 */
export const CELL_RENDER_VERSION_PROPERTY = '_renderVersion';

/**
 * A cell meta object seen through the one property this module reads and writes. Every cell meta
 * shape the code base passes around (`CellProperties`, the loosely typed records of the validation
 * paths) is assignable to it.
 */
export type VersionedCellMeta = { [CELL_RENDER_VERSION_PROPERTY]?: number } & Partial<CellProperties>;

/**
 * Returns the cell's render version: how many times its meta was written since it was created.
 *
 * @param {object} cellProperties The cell meta object.
 * @returns {number}
 */
export function getCellRenderVersion(cellProperties: VersionedCellMeta): number {
  return cellProperties[CELL_RENDER_VERSION_PROPERTY] ?? 0;
}

/**
 * Marks the cell as changed by advancing its render version.
 *
 * @param {object} cellProperties The cell meta object.
 */
export function markCellMetaChanged(cellProperties: VersionedCellMeta): void {
  cellProperties[CELL_RENDER_VERSION_PROPERTY] = getCellRenderVersion(cellProperties) + 1;
}

/**
 * Tracks the grid-wide state the incremental render compares against: the render epoch. The epoch
 * advances on every change that can move a cell to another element or alter what any cell shows
 * without a write to that cell's own meta – an index remap (sort, move, hide, trim, insert, remove),
 * a data reload, a settings update, and an explicit `Core#markAllCellsChanged()`.
 *
 * The per-cell half of the state lives on the cell meta objects themselves (see
 * {@link CELL_RENDER_VERSION_PROPERTY}); this class owns only the shared counter.
 */
export class RenderChangeTracker {
  /**
   * The render epoch.
   */
  #epoch = 0;

  /**
   * Returns the current render epoch.
   *
   * @returns {number}
   */
  get epoch(): number {
    return this.#epoch;
  }

  /**
   * Advances the render epoch, which makes every cell paint on the next draw regardless of its
   * `renderMode`.
   */
  markAllChanged(): void {
    this.#epoch += 1;
  }
}
