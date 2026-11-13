import type { TrackedRecord } from './recordTracker';

/**
 * The coordinates a stored cell meta object carries, which a validator reads through `this`.
 */
export interface StampedMeta {
  /**
   * The physical row of the cell.
   */
  row?: number | null;
  /**
   * The visual row of the cell.
   */
  visualRow?: number | null;
  /**
   * The property of the cell.
   */
  prop?: unknown;
}

/**
 * The part of the index mapper the stamps listen to.
 */
interface StampedIndexMapper {
  addLocalHook(key: string, callback: Function): unknown;
  removeLocalHook(key: string, callback: Function): unknown;
}

/**
 * Keeps the row coordinates of stored cell meta objects current while a validator call waits on them.
 */
export interface WaitingMetaStamps<M extends StampedMeta = StampedMeta> {
  /**
   * Keeps the `row` and `visualRow` of a meta object on the rows a tracked record has, until the returned
   * function is called.
   */
  add(record: TrackedRecord, meta: M): () => void;
  /**
   * Finds the kept meta of a property whose record still exists but has no visual row (a filter or a trim took it
   * out of the visual space): `preferred` when it is such a meta, else the meta of the only record that has one.
   * Returns `null` when no record, or more than one, has such a meta, or when a meta of the property was released
   * without a visual row while another meta is kept: its validator answered, and a correction it writes later
   * cannot be told from one of the waiting call.
   */
  findUnplaced(prop: unknown, preferred: M | null): { record: TrackedRecord, meta: M } | null;
  /**
   * The number of meta objects kept current now.
   */
  readonly size: number;
}

/**
 * Creates the stamps that keep the row coordinates of the stored cell meta of waiting validator calls current.
 * The meta manager writes `row` and `visualRow` on a stored meta object only when the meta is read again (a
 * render of the cell), so after a sort, a move, a filter, a trim, an insert or a removal that no render of the
 * cell followed, `this.visualRow` in a validator named another record. On every `cacheUpdated` of the row index
 * mapper, which follows each of those changes (inside `batch()`, once at its end), each kept meta gets the
 * physical row its record holds now and that row's visual row: `null` while the record is trimmed out of the
 * visual space or after a removal took it. The stamps listen only while they keep a meta, so an idle grid pays
 * nothing, and an event costs one pass over the kept metas.
 *
 * @param {Function} getIndexMapper Returns the row index mapper.
 * @param {Function} toVisualRow Returns the visual row of a physical row, or `null` for a trimmed one.
 * @returns {object}
 */
export function createWaitingMetaStamps<M extends StampedMeta = StampedMeta>(
  getIndexMapper: () => StampedIndexMapper,
  toVisualRow: (physicalRow: number) => number | null,
): WaitingMetaStamps<M> {
  const stamps = new Set<{ record: TrackedRecord, meta: M }>();
  const releasedUnplaced = new Set<M>();
  let listenedMapper: StampedIndexMapper | null = null;

  /**
   * Writes the rows each record holds now on its meta.
   */
  const onCacheUpdated = () => {
    stamps.forEach(({ record, meta }) => {
      const { physicalRow } = record;

      if (physicalRow === null) {
        meta.visualRow = null;

        return;
      }

      meta.row = physicalRow;
      meta.visualRow = toVisualRow(physicalRow);
    });
  };

  /**
   * Starts or stops listening, so the stamps listen exactly while they keep a meta. With no meta kept, no
   * correction can be folded, so the released metas without a visual row are forgotten too.
   */
  const syncListener = () => {
    if (stamps.size > 0 && listenedMapper === null) {
      listenedMapper = getIndexMapper();
      listenedMapper.addLocalHook('cacheUpdated', onCacheUpdated);

    } else if (stamps.size === 0 && listenedMapper !== null) {
      listenedMapper.removeLocalHook('cacheUpdated', onCacheUpdated);
      listenedMapper = null;
    }

    if (stamps.size === 0) {
      releasedUnplaced.clear();
    }
  };

  /**
   * Tells whether a meta of the property was released without a visual row and has none still. A meta that got
   * a visual row again (a render read it) is forgotten.
   *
   * @param {*} prop The property.
   * @returns {boolean}
   */
  const hasReleasedUnplaced = (prop: unknown) => {
    let isFound = false;

    releasedUnplaced.forEach((meta) => {
      if (meta.visualRow !== null) {
        releasedUnplaced.delete(meta);

      } else if (meta.prop === prop) {
        isFound = true;
      }
    });

    return isFound;
  };

  return {
    add(record, meta) {
      const stamp = { record, meta };

      releasedUnplaced.delete(meta);
      stamps.add(stamp);
      syncListener();

      return () => {
        stamps.delete(stamp);

        if (meta.visualRow === null) {
          releasedUnplaced.add(meta);
        }

        syncListener();
      };
    },
    findUnplaced(prop, preferred) {
      let found: { record: TrackedRecord, meta: M } | null = null;
      let isAmbiguous = false;

      for (const stamp of stamps) {
        const { record, meta } = stamp;

        if (meta.visualRow === null && record.physicalRow !== null && meta.prop === prop) {
          if (meta === preferred) {
            return stamp;
          }

          isAmbiguous = isAmbiguous || (found !== null && found.record !== record);
          found = found ?? stamp;
        }
      }

      return isAmbiguous || hasReleasedUnplaced(prop) ? null : found;
    },
    get size() {
      return stamps.size;
    },
  };
}
