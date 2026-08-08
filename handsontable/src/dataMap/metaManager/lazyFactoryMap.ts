import { isNullish } from './utils';
import { throwWithCause } from '../../helpers/errors';
import { isUnsignedNumber } from '../../helpers/number';

/**
 * The maximum number of key-shift operations (from `insert`/`remove`) buffered before they are
 * force-applied. Shifts are normally applied lazily, once, on the next full-view read
 * (`size`/`values`/`entries`), so a caller that loops single-row inserts/removes (for example,
 * `DataMap.removeRow` calls the meta layer once per removed physical row) pays one re-key pass
 * per batch instead of one per call. Contiguous runs of same-type shifts merge into a single
 * buffered entry, so the cap only bounds the buffer for scattered, non-mergeable loops.
 */
const MAX_PENDING_SHIFTS = 1024;

/**
 * A buffered key-shift operation. `amount > 0` with `isInsert` shifts keys at or above `start`
 * upwards; without `isInsert` it drops keys in `[start, start + amount)` and shifts higher keys
 * downwards.
 */
interface PendingShift {
  start: number;
  amount: number;
  isInsert: boolean;
}

/**
 * Throws when the key is not an unsigned integer. A plain function call instead of `assert()` -
 * `assert` takes a condition closure, and allocating one per `obtain` call is measurable on the
 * render path (the method runs twice per cell per draw).
 *
 * @param {*} key The key to validate.
 */
function assertUnsignedKey(key: unknown): asserts key is number {
  if (!isUnsignedNumber(key)) {
    throwWithCause('Assertion failed: Expecting an unsigned number.');
  }
}

/**
 * Throws when the key is neither an unsigned integer nor null/undefined.
 *
 * @param {*} key The key to validate.
 */
function assertUnsignedKeyOrNullish(key: unknown): asserts key is number | null | undefined {
  if (!isUnsignedNumber(key) && !isNullish(key)) {
    throwWithCause('Assertion failed: Expecting an unsigned number or null/undefined argument.');
  }
}

/**
 * @class LazyFactoryMap
 *
 * The LazyFactoryMap object holds key-value pairs in the structure similar to the
 * regular Map. Once created, items can be moved around a grid depending on the operations
 * performed on that grid - adding or removing rows. The collection requires "key"
 * to be a zero-based index.
 *
 * It's essential to notice that the "key" index under which the item was created
 * is volatile. After altering the grid, the "key" index can change.
 *
 * Values live in a single native Map keyed by the CURRENT volatile key. Lookups are a
 * single integer-keyed `Map.get` - a native Map is always a hash table, so far-apart keys
 * (for example, physical row 999990 on a million-row grid) cannot push the storage into a
 * slow mode, unlike a sparse array. Key shifts coming from `insert`/`remove` are buffered:
 * contiguous runs of same-type calls merge into one buffered shift, single-key reads
 * (`obtain`/`has`/`getIfExists`/`evict`) resolve through the buffer by mapping the requested
 * key back to its stored key in O(buffered shifts), and only full-view reads
 * (`size`/`values`/`entries`) apply the buffer in a single O(materialized) re-key pass that
 * rebuilds the map in its original iteration order - which keeps `values()` returning items
 * in order of initialization and makes a loop of single-row alters pay one pass per batch,
 * not one per call. The materialized size is normally viewport-bound thanks to the
 * render-derived cell meta eviction.
 */
export default class LazyFactoryMap<V = Record<string, unknown>> {
  /**
   * The data factory function.
   *
   * @type {Function}
   */
  declare valueFactory: (key: number) => V;
  /**
   * Materialized values keyed by the CURRENT volatile key (with any buffered shifts from
   * `#pendingShifts` not yet applied). Native Map iteration order is insertion order; the
   * shift-apply pass rebuilds the map preserving that relative order, so iteration stays in
   * order of value initialization.
   */
  #data = new Map<number, V>();
  /**
   * The logical length of the collection: slots created by `insert` plus slots implied by
   * obtaining a key at or past the current end. It only backs the "append"/"remove at end"
   * semantics of nullish `insert`/`remove` keys - it does not bound `obtain`. Every key
   * stored in the map is smaller than this value. Maintained eagerly (shifts do not defer it).
   */
  #length = 0;
  /**
   * Key-shift operations buffered by `insert`/`remove` and not yet applied to `#data`.
   * Applied in call order by `#applyPendingShifts` on the next read.
   */
  #pendingShifts: PendingShift[] = [];
  /**
   * An exclusive upper bound of the keys currently stored in `#data` (kept valid across
   * buffered shifts). It lets `insert`/`remove` skip buffering entirely when the operation
   * starts at or above every stored key - the common case of appending or altering far
   * beyond the materialized band - without scanning the keys.
   */
  #keyUpperBound = 0;
  /**
   * The highest key currently stored in `#data`, or `-1` when empty. May go stale-high after
   * `evict` of the highest key (conservative - only disables the fast flush path).
   */
  #maxStoredKey = -1;
  /**
   * True while the map's iteration order provably equals ascending key order (every
   * materialization so far appended a new maximum key). Enables the in-place flush fast path.
   */
  #isAscending = true;
  /**
   * True when an iterator over `#data` may still be live (handed out by `values`/`entries` and
   * possibly not yet exhausted). The in-place flush fast path mutates `#data` directly, which a
   * live iterator would observe - so the fast path is skipped; the rebuild path (which swaps the
   * map, detaching any live iterator) clears the flag.
   */
  #mayHaveLiveIterator = false;

  /**
   * Initializes the map with the given factory function used to create values for new keys on first access.
   */
  constructor(valueFactory: (key: number) => V) {
    this.valueFactory = valueFactory;
  }

  /**
   * Gets or if data not exist creates and returns new data.
   *
   * @param {number} key The item key as zero-based index.
   * @returns {*}
   */
  obtain(key: number): V {
    assertUnsignedKey(key);

    let storedKey = key;

    if (this.#pendingShifts.length > 0) {
      storedKey = this.#toStoredKey(key);

      // The key sits inside a pending inserted gap - no stored key can map to it, so a new
      // value has no stored coordinate to live under until the buffer is applied.
      if (storedKey === -1) {
        this.#applyPendingShifts();
        storedKey = key;
      }
    }

    let value = this.#data.get(storedKey);

    if (value === undefined) {
      value = this.valueFactory(key);
      this.#data.set(storedKey, value);

      if (key >= this.#length) {
        this.#length = key + 1;
      }

      // The bound must stay valid in both coordinate spaces: `storedKey` covers the map as
      // stored now, `key` covers it after the buffered shifts move `storedKey` to `key`.
      const boundKey = storedKey > key ? storedKey : key;

      if (boundKey >= this.#keyUpperBound) {
        this.#keyUpperBound = boundKey + 1;
      }

      // Ascending-order bookkeeping for the in-place flush fast path: a miss that does not
      // append a new maximum key breaks "iteration order == ascending key order".
      if (storedKey > this.#maxStoredKey) {
        this.#maxStoredKey = storedKey;
      } else {
        this.#isAscending = false;
      }
    }

    return value;
  }

  /**
   * Checks whether a value for the given key has already been created, without creating one.
   * Unlike `obtain`, this never triggers the value factory.
   *
   * @param {number} key The item key as zero-based index.
   * @returns {boolean}
   */
  has(key: number): boolean {
    return this.getIfExists(key) !== undefined;
  }

  /**
   * Inserts an empty space for new data. Materialized values stored under keys at or after
   * the insertion point are re-keyed upwards by `amount`; the inserted keys themselves stay
   * unmaterialized until the first `obtain` call. The re-keying is buffered (a contiguous run
   * of inserts merges into one buffered shift) and applied once on the next full-view read, so
   * a loop of inserts costs one re-key pass, not one per call. When the insertion point sits
   * at or above every stored key (the common case on a large grid, where only the viewport
   * band is materialized), nothing is buffered at all.
   *
   * @param {number} key The key as volatile zero-based index at which to begin inserting space for new data.
   * @param {number} [amount=1] Amount of data to insert.
   */
  insert(key: number | null | undefined, amount = 1) {
    assertUnsignedKeyOrNullish(key);

    const insertionIndex = isNullish(key) ? this.#length : key;

    this.#length += amount;

    if (insertionIndex >= this.#keyUpperBound) {
      return;
    }

    this.#keyUpperBound += amount;
    this.#bufferShift({ start: insertionIndex, amount, isInsert: true });
  }

  /**
   * Removes (soft remove) data from the map. Materialized values stored under the removed keys
   * are dropped (freed for garbage collection) and values under higher keys are re-keyed
   * downwards by `amount`. The re-keying is buffered (a contiguous run of removes - ascending
   * or descending - merges into one buffered shift) and applied once on the next full-view
   * read, so a loop of single-row removes (for example, the per-physical-row calls made by the
   * data layer when removing many rows at once) costs one re-key pass, not one per call. When
   * the removal point sits at or above every stored key, nothing is buffered at all.
   *
   * @param {number} key The key as volatile zero-based index at which to begin removing the data.
   * @param {number} [amount=1] Amount data to remove.
   */
  remove(key: number | null | undefined, amount = 1) {
    assertUnsignedKeyOrNullish(key);

    let start: number;

    if (isNullish(key)) {
      // Reproduces `index.splice(length - amount, amount)`: a negative start counts back from
      // the end (never below zero), exactly like `Array.prototype.splice`.
      const rawStart = this.#length - amount;

      start = rawStart < 0 ? Math.max(this.#length + rawStart, 0) : rawStart;
    } else {
      start = key;
    }

    const removedCount = Math.max(Math.min(this.#length - start, amount), 0);
    const isBeyondStoredKeys = start >= this.#keyUpperBound;

    this.#length -= removedCount;

    // Every stored key is smaller than `#length` both before and after a remove, so the upper
    // bound can be tightened to the new length. Without this, a remove would leave the bound
    // stale-high and a later append-at-end `insert(null)` (for example, the `minSpareRows`
    // spare-row top-up on every keystroke in the last row) would buffer a shift that can never
    // affect a stored key.
    if (this.#keyUpperBound > this.#length) {
      this.#keyUpperBound = this.#length;
    }

    if (isBeyondStoredKeys) {
      return;
    }

    this.#bufferShift({ start, amount, isInsert: false });
  }

  /**
   * Returns the number of materialized values this map currently holds. Keys reserved through
   * `insert` but never obtained, and keys released through `evict` or `remove`, are not counted.
   *
   * @returns {number}
   */
  size() {
    if (this.#pendingShifts.length > 0) {
      this.#applyPendingShifts();
    }

    return this.#data.size;
  }

  /**
   * Returns a new Iterator object that contains the values for each item in the LazyMap object,
   * in order of value initialization.
   *
   * @returns {Iterator}
   */
  values(): IterableIterator<V> {
    if (this.#pendingShifts.length > 0) {
      this.#applyPendingShifts();
    }

    this.#mayHaveLiveIterator = true;

    return this.#data.values();
  }

  /**
   * Returns a new Iterator object that contains an array of `[index, value]` for each item in
   * the LazyMap object, in order of value initialization.
   *
   * Mutation-during-iteration contract (also applies to `values()`): the iterator follows
   * native Map semantics. Releasing the currently visited key through `evict` (as
   * `CellMeta.evictRow` does) is safe; a value materialized mid-loop through `obtain` of a new
   * key WILL be visited. Calling `insert`/`remove` mid-loop only buffers the key shift, so the
   * walk continues undisturbed over the pre-shift view; if another read flushes the buffered
   * shifts mid-loop, the walk still completes over the pre-shift map it started on.
   *
   * @returns {Iterator}
   */
  entries(): IterableIterator<[number, V]> {
    if (this.#pendingShifts.length > 0) {
      this.#applyPendingShifts();
    }

    this.#mayHaveLiveIterator = true;

    return this.#data.entries();
  }

  /**
   * Releases the value stored under the given key. The next `obtain` call for that key
   * re-creates the value through the factory (with a new identity). Unlike `remove`, the
   * surrounding keys do not shift, so this is safe for values that can be reconstructed
   * deterministically - for example render-derived cell meta for rows scrolled out of the
   * viewport. The entry is genuinely deleted, so its memory is freed - there is no leftover
   * slot. Does nothing when the key has no materialized value.
   *
   * @param {number} key The item key as zero-based index.
   */
  evict(key: number) {
    if (this.#pendingShifts.length > 0) {
      const storedKey = this.#toStoredKey(key);

      if (storedKey !== -1) {
        this.#data.delete(storedKey);
      }

      return;
    }

    this.#data.delete(key);
  }

  /**
   * Returns the value stored under the given key, or `undefined` when the key has no materialized
   * value. Unlike `obtain`, it never creates a value through the factory, so it is safe for
   * read-only existence checks against the current contents.
   *
   * @param {number} key The item key as zero-based index.
   * @returns {*}
   */
  getIfExists(key: number): V | undefined {
    if (this.#pendingShifts.length > 0) {
      const storedKey = this.#toStoredKey(key);

      return storedKey === -1 ? undefined : this.#data.get(storedKey);
    }

    return this.#data.get(key);
  }

  /**
   * Clears the map.
   */
  clear() {
    this.#data.clear();
    this.#pendingShifts = [];
    this.#length = 0;
    this.#keyUpperBound = 0;
    this.#maxStoredKey = -1;
    this.#isAscending = true;
    this.#mayHaveLiveIterator = false;
  }

  /**
   * Buffers a key-shift operation, first trying to merge it into the previous one (a loop of
   * contiguous single-slot calls - such as the descending per-row removes made by
   * `DataMap.removeRow` - collapses into a single buffered shift). When the buffer still grows
   * past `MAX_PENDING_SHIFTS`, it is force-applied as a backstop for scattered, non-mergeable
   * loops that never read between mutations.
   *
   * @param {object} shift The shift operation to buffer.
   */
  #bufferShift(shift: PendingShift) {
    const shifts = this.#pendingShifts;
    const last = shifts.length > 0 ? shifts[shifts.length - 1] : undefined;

    if (last !== undefined && last.isInsert === shift.isInsert && this.#tryMergeShift(last, shift)) {
      return;
    }

    shifts.push(shift);

    if (shifts.length >= MAX_PENDING_SHIFTS) {
      this.#applyPendingShifts();
    }
  }

  /**
   * Merges the incoming shift into the last buffered one when the two are provably equivalent
   * to a single wider shift, and reports whether the merge happened. Two inserts merge when the
   * new insertion point falls inside (or at either edge of) the still-pending inserted gap. Two
   * removes merge when they start at the same key (an ascending loop - each call removes the
   * next value that slid down into the same spot) or when the new range ends exactly where the
   * previous one starts (a descending loop). Both callers must operate on the same shift type.
   *
   * @param {object} last The shift the buffer currently ends with, mutated on merge.
   * @param {object} shift The incoming shift.
   * @returns {boolean}
   */
  #tryMergeShift(last: PendingShift, shift: PendingShift): boolean {
    if (shift.isInsert) {
      if (shift.start >= last.start && shift.start <= last.start + last.amount) {
        last.amount += shift.amount;

        return true;
      }

      return false;
    }

    if (shift.start === last.start) {
      last.amount += shift.amount;

      return true;
    }

    if (shift.start + shift.amount === last.start) {
      last.start = shift.start;
      last.amount += shift.amount;

      return true;
    }

    return false;
  }

  /**
   * Maps a key from the current (post-shift) coordinate space back to the stored key it
   * corresponds to in `#data`, by undoing the buffered shifts in reverse call order. Returns
   * `-1` when the key falls inside a still-pending inserted gap - no stored key maps there.
   * This lets single-key reads resolve through the buffer in O(buffered shifts) instead of
   * forcing the O(materialized) re-key pass.
   *
   * @param {number} key The key in the current coordinate space.
   * @returns {number}
   */
  #toStoredKey(key: number): number {
    const shifts = this.#pendingShifts;
    let storedKey = key;

    for (let i = shifts.length - 1; i >= 0; i--) {
      const { start, amount, isInsert } = shifts[i];

      if (isInsert) {
        if (storedKey >= start + amount) {
          storedKey -= amount;
        } else if (storedKey >= start) {
          return -1;
        }
      } else if (storedKey >= start) {
        storedKey += amount;
      }
    }

    return storedKey;
  }

  /**
   * Applies every buffered key-shift operation in call order with a single pass over the
   * stored entries. When no stored key is affected (every key sits below the lowest shift
   * point), the map is left untouched with no allocation. Otherwise the map is rebuilt in its
   * original iteration order, which preserves the initialization-order contract of `values()`.
   */
  #applyPendingShifts() {
    const shifts = this.#pendingShifts;

    this.#pendingShifts = [];

    // Fast path: a single contiguous remove on a map whose keys are provably dense
    // (0..size-1, by pigeonhole from maxKey == size-1) and iterated in ascending key
    // order. Values slide down in place - keys never move, so the Map's structure and
    // iteration order stay untouched, at a fraction of the full-rebuild cost.
    if (
      shifts.length === 1 && !shifts[0].isInsert && !this.#mayHaveLiveIterator &&
      this.#isAscending && this.#maxStoredKey === this.#data.size - 1
    ) {
      this.#applySingleRemoveInPlace(shifts[0].start, shifts[0].amount);

      return;
    }

    // Suffix minima of the shift starts: `minStartFrom[i]` is the lowest start among
    // `shifts[i..]`. A key smaller than it cannot be touched by any remaining shift, so the
    // per-key transform loop can stop early - which matters for scattered non-mergeable
    // batches, where most keys sit below most shift points.
    const minStartFrom = new Array(shifts.length);
    let lowestStart = Infinity;

    for (let i = shifts.length - 1; i >= 0; i--) {
      if (shifts[i].start < lowestStart) {
        lowestStart = shifts[i].start;
      }
      minStartFrom[i] = lowestStart;
    }

    let isAffected = false;

    for (const itemKey of this.#data.keys()) {
      if (itemKey >= lowestStart) {
        isAffected = true;
        break;
      }
    }

    if (!isAffected) {
      return;
    }

    const shifted = new Map<number, V>();
    let highestKey = -1;
    let isAscending = true;
    let previousKey = -1;

    for (const [itemKey, value] of this.#data) {
      const newKey = this.#transformKey(itemKey, shifts, minStartFrom);

      if (newKey !== -1) {
        shifted.set(newKey, value);

        if (newKey > highestKey) {
          highestKey = newKey;
        }

        if (newKey <= previousKey) {
          isAscending = false;
        }
        previousKey = newKey;
      }
    }

    this.#data = shifted;
    // The old map (with any live iterators on it) is detached - in-place flushes of the NEW map
    // can no longer be observed through iterators created before this rebuild.
    this.#mayHaveLiveIterator = false;
    // The rebuild visits every entry anyway, so the key upper bound can be made exact for
    // free, and the ascending-order flag re-derived (a map can recover the fast flush path).
    this.#keyUpperBound = highestKey + 1;
    this.#maxStoredKey = highestKey;
    this.#isAscending = isAscending;
  }

  /**
   * Applies a single buffered remove in place on a dense, ascending-ordered map: the value
   * stored under each key at or above the removal point is overwritten with the value
   * `amount` slots above it, and the now-duplicated top `amount` keys are deleted. Keys are
   * only updated or deleted (never inserted), so the Map's iteration order stays ascending
   * and the result is identical to the full rebuild - at the cost of only the affected
   * suffix, with no allocation and no hash-table churn.
   *
   * @param {number} start The first removed key.
   * @param {number} amount The number of removed keys.
   */
  #applySingleRemoveInPlace(start: number, amount: number) {
    const data = this.#data;
    const size = data.size;
    const survivorsTop = Math.max(size - amount, start);

    for (let key = start; key < survivorsTop; key++) {
      data.set(key, data.get(key + amount) as V);
    }

    for (let key = survivorsTop; key < size; key++) {
      data.delete(key);
    }

    this.#maxStoredKey = survivorsTop - 1;
    this.#keyUpperBound = survivorsTop;
  }

  /**
   * Runs a stored key through the buffered shift operations in call order and returns the
   * resulting key, or `-1` when one of the remove operations drops it. Stops early once the
   * key sits below every remaining shift point (`minStartFrom` suffix minima), where it can
   * no longer change.
   *
   * @param {number} key The stored key to transform.
   * @param {object[]} shifts The buffered shift operations, in call order.
   * @param {number[]} minStartFrom For each position, the lowest shift start from there on.
   * @returns {number}
   */
  #transformKey(key: number, shifts: PendingShift[], minStartFrom: number[]): number {
    let currentKey = key;

    for (let i = 0; i < shifts.length; i++) {
      if (currentKey < minStartFrom[i]) {
        return currentKey;
      }

      const { start, amount, isInsert } = shifts[i];

      if (isInsert) {
        if (currentKey >= start) {
          currentKey += amount;
        }
      } else if (currentKey >= start + amount) {
        currentKey -= amount;
      } else if (currentKey >= start) {
        return -1;
      }
    }

    return currentKey;
  }

  /**
   * Makes this object iterable.
   *
   * @returns {Iterator}
   */
  [Symbol.iterator](): IterableIterator<[number, V]> {
    return this.entries();
  }
}
