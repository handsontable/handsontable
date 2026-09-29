import { deepClone } from '../helpers/object';
import { isFunction } from '../helpers/function';
import type { IndexMapper } from './indexMapper';
import type { IndexMap } from './maps/indexMap';
import { IndexesSequence } from './maps/indexesSequence';
import { BooleanMap } from './maps/booleanMap';
import { LinkedPhysicalIndexToValueMap } from './maps/linkedPhysicalIndexToValueMap';
import type { MapCollection } from './mapCollections/mapCollection';

/**
 * The state of one index map, detached from the map. Every variant is immutable: a snapshot is
 * shared between the undo steps that did not change the map, so nothing may write into it.
 *
 * - `default`: every value is the map's default (an identity sequence, a boolean map with nothing
 *   hidden or trimmed). Nothing is copied, so a grid that never sorts or hides pays nothing.
 * - `sequence`: a materialized indexes sequence.
 * - `bitset`: a materialized boolean map, one bit per index.
 * - `linked`: the linked entries of a `LinkedPhysicalIndexToValueMap`, in link order.
 * - `sparse`: the entries of a map whose default is a constant that do not hold the default.
 * - `dense`: every value of any other map.
 */
export type IndexMapSnapshot =
  | { readonly kind: 'default'; readonly length: number }
  | { readonly kind: 'sequence'; readonly values: Int32Array }
  | { readonly kind: 'bitset'; readonly length: number; readonly bits: Uint8Array }
  | { readonly kind: 'linked'; readonly length: number; readonly entries: ReadonlyArray<[number, unknown]> }
  | { readonly kind: 'sparse'; readonly length: number; readonly entries: ReadonlyArray<[number, unknown]> }
  | { readonly kind: 'dense'; readonly values: readonly unknown[] };

/**
 * The state of every index map an axis holds, by map name, plus the axis length.
 */
export interface IndexMapperSnapshot {
  readonly length: number;
  readonly sequence: IndexMapSnapshot;
  readonly trimming: ReadonlyMap<string, IndexMapSnapshot>;
  readonly hiding: ReadonlyMap<string, IndexMapSnapshot>;
  readonly various: ReadonlyMap<string, IndexMapSnapshot>;
}

/**
 * The maps that hold measurements rather than state: their plugin derives the values from the
 * rendered grid (or, for a sorting plugin's `<key>.columnMeta`, from the column settings). Restoring
 * one would put back a measurement of a layout that no longer exists, so they are never captured, and
 * a change to one never makes the tracker dirty - the size plugins write on the render path.
 * Pagination's map is derived too: the plugin rebuilds it from the page it restores and from the
 * other maps, and with `pageSize: 'auto'` it rebuilds it on every render. It is registered under the
 * plugin's registry name, which is capitalized (`'Pagination'`), not under its settings key.
 */
const DERIVED_INDEX_MAP_NAMES: ReadonlySet<string> = new Set([
  'autoRowSize',
  'autoColumnSize',
  'stretchColumns',
  'nestedHeaders.widthsMap',
  'Pagination',
]);

/**
 * Above this share of non-default entries a map is stored whole: the pairs would take more memory
 * than the plain array.
 */
const SPARSE_DENSITY_LIMIT = 0.25;

/**
 * Tells whether a map holds derived measurements rather than state (see `DERIVED_INDEX_MAP_NAMES`).
 * Two name patterns are derived as well: a sorting plugin's `<key>.columnMeta`, and the Filters menu
 * components' `Filters.component.<id>` maps. Those hold the menu's UI state per column (the value
 * list included, rewritten on every edit in a column filtered by value), and the Filters plugin
 * rebuilds them from the conditions its `restoreState()` imports.
 *
 * @param {string} name The map name.
 * @returns {boolean}
 */
export function isDerivedIndexMap(name: string): boolean {
  return DERIVED_INDEX_MAP_NAMES.has(name) || name.endsWith('.columnMeta') || name.startsWith('Filters.component.');
}

/**
 * Tells whether two entry lists hold the same indexes and values. Values are compared by identity
 * first and then structurally, since a linked map stores objects (filter conditions) that are
 * rebuilt on every write.
 *
 * @param {Array} left One list.
 * @param {Array} right The other list.
 * @returns {boolean}
 */
function areEntriesEqual(left: ReadonlyArray<[number, unknown]>, right: ReadonlyArray<[number, unknown]>): boolean {
  return left.length === right.length && left.every(([index, value], position) => {
    const [otherIndex, otherValue] = right[position];

    return index === otherIndex && (value === otherValue || JSON.stringify(value) === JSON.stringify(otherValue));
  });
}

/**
 * Tells whether two array-likes hold the same values, compared by identity.
 *
 * @param {ArrayLike} left One array.
 * @param {ArrayLike} right The other array.
 * @returns {boolean}
 */
function areValuesEqual(left: ArrayLike<unknown>, right: ArrayLike<unknown>): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

/**
 * Tells whether two snapshots describe the same map state. A map fires `change` for a write that
 * leaves it as it was (a sequence set to itself, a flag re-written), and such a write must not look
 * like a change - UndoRedo records a step only when the state differs.
 *
 * @param {IndexMapSnapshot} left One snapshot.
 * @param {IndexMapSnapshot} right The other snapshot.
 * @returns {boolean}
 */
export function areIndexMapSnapshotsEqual(left: IndexMapSnapshot, right: IndexMapSnapshot): boolean {
  if (left === right) {
    return true;
  }

  switch (left.kind) {
    case 'default':
      return right.kind === 'default' && left.length === right.length;
    case 'sequence':
      return right.kind === 'sequence' && areValuesEqual(left.values, right.values);
    case 'bitset':
      return right.kind === 'bitset' && left.length === right.length && areValuesEqual(left.bits, right.bits);
    case 'linked':
      return right.kind === 'linked' && left.length === right.length && areEntriesEqual(left.entries, right.entries);
    case 'sparse':
      return right.kind === 'sparse' && left.length === right.length && areEntriesEqual(left.entries, right.entries);
    default:
      return right.kind === 'dense' && areValuesEqual(left.values, right.values);
  }
}

/**
 * Captures a boolean map as a bitset.
 *
 * @param {BooleanMap} map The map.
 * @returns {IndexMapSnapshot}
 */
function captureBooleanMap(map: BooleanMap): IndexMapSnapshot {
  const length = map.getLength();

  if (map.isAllDefault()) {
    return { kind: 'default', length };
  }

  const values = map.getValues();
  const bits = new Uint8Array(Math.ceil(length / 8));

  for (let index = 0; index < length; index += 1) {
    if (values[index] === true) {
      bits[index >> 3] |= 1 << (index & 7); // eslint-disable-line no-bitwise
    }
  }

  return { kind: 'bitset', length, bits };
}

/**
 * Captures a map whose default is a constant as its non-default entries, or whole when most entries
 * are set.
 *
 * @param {IndexMap} map The map.
 * @returns {IndexMapSnapshot}
 */
function captureValueMap(map: IndexMap): IndexMapSnapshot {
  const values = map.getValues();

  if (isFunction(map.initValueOrFn)) {
    return { kind: 'dense', values: values.map(value => deepClone(value)) };
  }

  const defaultValue = map.initValueOrFn;
  const entries: Array<[number, unknown]> = [];
  const denseLimit = values.length * SPARSE_DENSITY_LIMIT;

  for (let index = 0; index < values.length; index += 1) {
    if (values[index] !== defaultValue) {
      if (entries.length >= denseLimit) {
        return { kind: 'dense', values: values.map(value => deepClone(value)) };
      }

      entries.push([index, deepClone(values[index])]);
    }
  }

  return { kind: 'sparse', length: values.length, entries };
}

/**
 * Captures the state of one index map.
 *
 * @param {IndexMap} map The map.
 * @returns {IndexMapSnapshot}
 */
export function captureIndexMap(map: IndexMap): IndexMapSnapshot {
  if (map instanceof IndexesSequence) {
    return map.isIdentity()
      ? { kind: 'default', length: map.getLength() }
      : { kind: 'sequence', values: Int32Array.from(map.getValues()) };
  }

  if (map instanceof BooleanMap) {
    return captureBooleanMap(map);
  }

  if (map instanceof LinkedPhysicalIndexToValueMap) {
    return {
      kind: 'linked',
      length: map.indexedValues.length,
      entries: map.orderOfIndexes.map(physicalIndex => [physicalIndex, deepClone(map.indexedValues[physicalIndex])]),
    };
  }

  return captureValueMap(map);
}

/**
 * Builds the array a `sparse` snapshot describes.
 *
 * @param {IndexMap} map The map the array is for (its default value fills the gaps).
 * @param {number} length The array length.
 * @param {Array} entries The `[index, value]` pairs.
 * @returns {Array}
 */
function expandSparse(map: IndexMap, length: number, entries: ReadonlyArray<[number, unknown]>): unknown[] {
  const values = new Array<unknown>(length).fill(map.initValueOrFn);

  entries.forEach(([index, value]) => {
    values[index] = deepClone(value);
  });

  return values;
}

/**
 * Puts a captured state back into a map (other than the indexes sequence).
 *
 * @param {IndexMap} map The map.
 * @param {IndexMapSnapshot} snapshot The state to restore.
 */
function restoreIndexMap(map: IndexMap, snapshot: IndexMapSnapshot) {
  switch (snapshot.kind) {
    case 'default':
      map.setDefaultValues(snapshot.length);
      break;

    case 'bitset': {
      const values = new Array<boolean>(snapshot.length);

      for (let index = 0; index < snapshot.length; index += 1) {
        values[index] = (snapshot.bits[index >> 3] & (1 << (index & 7))) !== 0; // eslint-disable-line no-bitwise
      }

      map.setValues(values);
      break;
    }

    case 'linked':
      // A reset clears the link order, and each write links its index again - in the captured order.
      map.setDefaultValues(snapshot.length);
      snapshot.entries.forEach(([physicalIndex, value]) => {
        map.setValueAtIndex(physicalIndex, deepClone(value));
      });
      break;

    case 'sparse':
      map.setValues(expandSparse(map, snapshot.length, snapshot.entries));
      break;

    case 'dense':
      map.setValues(snapshot.values.map(value => deepClone(value)));
      break;

    default:
      // A `sequence` snapshot belongs to the indexes sequence, which is restored through the mapper.
      break;
  }
}

/**
 * The three map collections an `IndexMapper` holds, by snapshot key.
 */
const COLLECTION_KEYS = ['trimming', 'hiding', 'various'] as const;

type CollectionKey = typeof COLLECTION_KEYS[number];

/**
 * Returns one of the mapper's map collections by snapshot key.
 *
 * @param {IndexMapper} mapper The index mapper.
 * @param {string} key The snapshot key.
 * @returns {MapCollection}
 */
function getCollection(mapper: IndexMapper, key: CollectionKey): MapCollection {
  if (key === 'trimming') {
    return mapper.trimmingMapsCollection;
  }

  return key === 'hiding' ? mapper.hidingMapsCollection : mapper.variousMapsCollection;
}

/**
 * Tells whether two maps hold the same keys.
 *
 * @param {Map} first The first map.
 * @param {Map} second The second map.
 * @returns {boolean}
 */
function haveSameKeys(first: ReadonlyMap<string, unknown>, second: ReadonlyMap<string, unknown>): boolean {
  return first === second ||
    (first.size === second.size && Array.from(first.keys()).every(key => second.has(key)));
}

/**
 * Tells whether two snapshots of an axis name the same index maps. The names change when a plugin
 * that owns a map is turned on or off; a plugin that re-registers its map under the same name (a
 * settings update that disables and enables it again) does not change them.
 *
 * @param {IndexMapperSnapshot} first The first snapshot.
 * @param {IndexMapperSnapshot} second The second snapshot.
 * @returns {boolean}
 */
export function haveSameIndexMaps(first: IndexMapperSnapshot, second: IndexMapperSnapshot): boolean {
  return first === second || COLLECTION_KEYS.every(key => haveSameKeys(first[key], second[key]));
}

/**
 * Captures and restores the state of one `IndexMapper` - its indexes sequence and every map it
 * holds - copy-on-change: it listens to the mapper and copies a map only when the map changed since
 * the previous capture. A capture of an axis nothing changed on returns the previous snapshot
 * itself, and within a snapshot every map that did not change is the previous snapshot's object,
 * so a chain of snapshots costs memory only for what actually changed.
 *
 * The maps are recorded by name, not by reference: disabling a plugin destroys its maps, and
 * enabling it again registers new ones under the same names. A restore skips a name the mapper no
 * longer holds, and leaves alone a map the snapshot does not name.
 */
export class IndexMapperStateTracker {
  /**
   * The tracked mapper.
   */
  #mapper: IndexMapper;
  /**
   * The maps that changed since the previous capture.
   */
  #dirty = new Set<IndexMap>();
  /**
   * The snapshot the previous capture took of each map.
   */
  #lastMapSnapshots = new WeakMap<IndexMap, IndexMapSnapshot>();
  /**
   * The previous capture.
   */
  #lastSnapshot: IndexMapperSnapshot | null = null;

  /**
   * Starts tracking the mapper.
   *
   * @param {IndexMapper} mapper The index mapper.
   */
  constructor(mapper: IndexMapper) {
    this.#mapper = mapper;
    this.#mapper.addLocalHook('change', this.#onMapChange);
  }

  /**
   * Tells whether any state map changed since the previous capture.
   *
   * @returns {boolean}
   */
  isDirty(): boolean {
    return this.#lastSnapshot === null || this.#dirty.size > 0;
  }

  /**
   * Captures the mapper's state, copying only the maps that changed since the previous capture.
   *
   * @returns {IndexMapperSnapshot}
   */
  capture(): IndexMapperSnapshot {
    const previous = this.#lastSnapshot;

    if (previous !== null && this.#dirty.size === 0) {
      return previous;
    }

    const mapper = this.#mapper;
    const snapshot: IndexMapperSnapshot = {
      // Not `getNumberOfIndexes()`: it reads the length off `getValues()`, which materializes an
      // identity sequence.
      length: mapper.indexesSequence.getLength(),
      sequence: this.#captureMap(mapper.indexesSequence),
      trimming: this.#captureCollection(mapper.trimmingMapsCollection, previous?.trimming),
      hiding: this.#captureCollection(mapper.hidingMapsCollection, previous?.hiding),
      various: this.#captureCollection(mapper.variousMapsCollection, previous?.various),
    };

    this.#dirty.clear();

    // Every part unchanged (the maps only fired `change` for writes that left them as they were):
    // the previous snapshot still describes the axis.
    if (
      previous !== null &&
      previous.length === snapshot.length &&
      previous.sequence === snapshot.sequence &&
      previous.trimming === snapshot.trimming &&
      previous.hiding === snapshot.hiding &&
      previous.various === snapshot.various
    ) {
      return previous;
    }

    this.#lastSnapshot = snapshot;

    return snapshot;
  }

  /**
   * Puts the mapper into a captured state. The axis length is fitted first, then the maps are written
   * back inside one suspended batch, so the index caches are rebuilt once.
   *
   * Which maps are written depends on `changedFrom`. Given the snapshot from the other side of an undo
   * step, only the maps the step changed are written (the two snapshots hold different objects for
   * them) - a map the step left alone keeps its current state, including a change made to it outside
   * any step since. Without it, every map whose state differs from the current one is written.
   *
   * @param {IndexMapperSnapshot} snapshot The state to restore.
   * @param {object} [options] Restore options.
   * @param {IndexMapperSnapshot} [options.changedFrom] The snapshot from the other side of the step.
   * @param {boolean} [options.forceOrder=false] Write the sequence and the trimming maps back even
   *   when the step did not change them - a replay reset them to the physical order.
   */
  restore(
    snapshot: IndexMapperSnapshot,
    { changedFrom, forceOrder = false }: { changedFrom?: IndexMapperSnapshot, forceOrder?: boolean } = {},
  ) {
    const mapper = this.#mapper;
    const current = this.capture();
    const reference = changedFrom ?? current;
    const lengthChanged = current.length !== snapshot.length;
    const restored: Array<[IndexMap, IndexMapSnapshot]> = [];

    if (lengthChanged) {
      mapper.fitToLength(snapshot.length);
    }

    mapper.suspendOperations();

    try {
      if (lengthChanged || forceOrder || reference.sequence !== snapshot.sequence) {
        this.#restoreSequence(snapshot.sequence, snapshot.length);
        restored.push([mapper.indexesSequence, snapshot.sequence]);
      }

      COLLECTION_KEYS.forEach((key) => {
        const collection = getCollection(mapper, key);
        const referenceMaps = reference[key];
        const forced = forceOrder && key === 'trimming';

        snapshot[key].forEach((mapSnapshot, name) => {
          const map = collection.get(name);

          if (map !== undefined && (lengthChanged || forced || referenceMaps.get(name) !== mapSnapshot)) {
            restoreIndexMap(map, mapSnapshot);
            restored.push([map, mapSnapshot]);
          }
        });
      });
    } finally {
      mapper.resumeOperations();
    }

    // The written maps hold exactly their snapshots now, so the next capture reuses them instead of
    // copying the maps back. Every other map keeps its own state and is captured as usual.
    restored.forEach(([map, mapSnapshot]) => {
      this.#lastMapSnapshots.set(map, mapSnapshot);
      this.#dirty.delete(map);
    });
    this.#lastSnapshot = null;
  }

  /**
   * Forgets the previous capture, so the next capture copies every map again.
   */
  reset() {
    this.#dirty.clear();
    this.#lastSnapshot = null;
    this.#lastMapSnapshots = new WeakMap();
  }

  /**
   * Stops tracking the mapper.
   */
  destroy() {
    this.#mapper.removeLocalHook('change', this.#onMapChange);
    this.reset();
  }

  /**
   * Writes the indexes sequence back through the mapper, so its listeners (the Formulas plugin's
   * axis syncer) receive a regular sequence update.
   *
   * @param {IndexMapSnapshot} snapshot The sequence state.
   * @param {number} length The axis length.
   */
  #restoreSequence(snapshot: IndexMapSnapshot, length: number) {
    if (snapshot.kind === 'sequence') {
      this.#mapper.setIndexesSequence(Array.from(snapshot.values));

      return;
    }

    const identity = new Array<number>(length);

    for (let index = 0; index < length; index += 1) {
      identity[index] = index;
    }

    this.#mapper.setIndexesSequence(identity);
  }

  /**
   * Captures every state map of a collection, reusing the previous snapshot of each map that did not
   * change.
   *
   * @param {MapCollection} collection The map collection.
   * @returns {Map<string, IndexMapSnapshot>}
   */
  #captureCollection(
    collection: MapCollection,
    previous: ReadonlyMap<string, IndexMapSnapshot> | undefined,
  ): ReadonlyMap<string, IndexMapSnapshot> {
    const snapshots = new Map<string, IndexMapSnapshot>();

    collection.collection.forEach((map, name) => {
      if (!isDerivedIndexMap(name)) {
        snapshots.set(name, this.#captureMap(map));
      }
    });

    if (previous !== undefined && previous.size === snapshots.size &&
      Array.from(snapshots).every(([name, snapshot]) => previous.get(name) === snapshot)) {
      return previous;
    }

    return snapshots;
  }

  /**
   * Captures one map, reusing its previous snapshot when it did not change.
   *
   * @param {IndexMap} map The map.
   * @returns {IndexMapSnapshot}
   */
  #captureMap(map: IndexMap): IndexMapSnapshot {
    const previous = this.#lastMapSnapshots.get(map);

    if (previous !== undefined && !this.#dirty.has(map)) {
      return previous;
    }

    const snapshot = captureIndexMap(map);

    if (previous !== undefined && areIndexMapSnapshotsEqual(previous, snapshot)) {
      return previous;
    }

    this.#lastMapSnapshots.set(map, snapshot);

    return snapshot;
  }

  /**
   * Marks a map as changed. A derived map is ignored. An unregistered map is still marked: the set of
   * maps changed, so the next capture must rebuild the collection.
   *
   * @param {IndexMap} changedMap The map that changed.
   * @param {MapCollection|null} collection The collection that holds it (`null` for the sequence).
   */
  #onMapChange = (changedMap: IndexMap, collection: MapCollection | null) => {
    if (collection !== null && this.#isDerived(changedMap, collection)) {
      return;
    }

    this.#dirty.add(changedMap);
  };

  /**
   * Tells whether a map that fired a change is one of the derived maps of its collection.
   *
   * @param {IndexMap} map The map.
   * @param {MapCollection} collection The collection that holds it.
   * @returns {boolean}
   */
  #isDerived(map: IndexMap, collection: MapCollection): boolean {
    for (const [name, registeredMap] of collection.collection) {
      if (registeredMap === map) {
        return isDerivedIndexMap(name);
      }
    }

    return false;
  }
}
