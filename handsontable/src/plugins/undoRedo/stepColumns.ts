import type { HotInstance } from '../../core/types';
import type { BasePlugin } from '../base';
import type { IndexMapSnapshot, IndexMapperSnapshot } from '../../translations/indexMapperSnapshot';
import type { StepRecord } from './entry';

/**
 * Tells whether a physical column shows another field than it did when the steps were recorded, or
 * does not exist anymore.
 */
export type ColumnChangeTest = (physicalColumn: number) => boolean;

/**
 * Lists the non-default entries of an index map snapshot by index, or returns `null` for a snapshot
 * that stores every value (`dense`) or an order (`sequence`) – those are compared as a whole.
 *
 * @param {IndexMapSnapshot} snapshot The snapshot.
 * @returns {Map<number, *>|null}
 */
function readEntries(snapshot: IndexMapSnapshot): Map<number, unknown> | null {
  const entries = new Map<number, unknown>();

  switch (snapshot.kind) {
    case 'default':
      return entries;
    case 'bitset':
      for (let index = 0; index < snapshot.length; index += 1) {
        if (snapshot.bits[index >> 3] & (1 << (index & 7))) { // eslint-disable-line no-bitwise
          entries.set(index, true);
        }
      }

      return entries;
    case 'sparse':
    case 'linked':
      snapshot.entries.forEach(([index, value]) => {
        entries.set(index, value);
      });

      return entries;
    default:
      return null;
  }
}

/**
 * Returns the length of the axis an index map snapshot describes.
 *
 * @param {IndexMapSnapshot} snapshot The snapshot.
 * @returns {number}
 */
function snapshotLength(snapshot: IndexMapSnapshot): number {
  return snapshot.kind === 'sequence' || snapshot.kind === 'dense' ? snapshot.values.length : snapshot.length;
}

/**
 * Lists the indexes whose value differs between two snapshots of one index map, or returns `null`
 * when the map can only be compared as a whole: an order, a map that stores every value, a map of
 * another length, or a linked map whose order changed.
 *
 * @param {IndexMapSnapshot} before The map on one side of the step.
 * @param {IndexMapSnapshot} after The map on the other side.
 * @returns {number[]|null}
 */
function changedIndexes(before: IndexMapSnapshot, after: IndexMapSnapshot): number[] | null {
  if (before === after) {
    return [];
  }

  const left = readEntries(before);
  const right = readEntries(after);

  if (left === null || right === null || snapshotLength(before) !== snapshotLength(after)) {
    return null;
  }

  // A linked map is ordered: the Filters conditions apply in stack order.
  if (before.kind === 'linked' && after.kind === 'linked') {
    const leftOrder = before.entries.map(([index]) => index).filter(index => right.has(index));
    const rightOrder = after.entries.map(([index]) => index).filter(index => left.has(index));

    if (leftOrder.some((index, position) => index !== rightOrder[position])) {
      return null;
    }
  }

  const indexes = new Set<number>();

  left.forEach((value, index) => {
    const other = right.get(index);

    if (!right.has(index) || (value !== other && JSON.stringify(value) !== JSON.stringify(other))) {
      indexes.add(index);
    }
  });
  right.forEach((_, index) => {
    if (!left.has(index)) {
      indexes.add(index);
    }
  });

  return Array.from(indexes);
}

/**
 * Tells whether a step changed a column index map at a column that changed.
 *
 * @param {IndexMapperSnapshot} before The column axis before the step.
 * @param {IndexMapperSnapshot} after The column axis after the step.
 * @param {Function} isChanged The column test.
 * @returns {boolean}
 */
function changesColumnMaps(before: IndexMapperSnapshot, after: IndexMapperSnapshot, isChanged: ColumnChangeTest) {
  if (before.sequence !== after.sequence) {
    return true;
  }

  return (['trimming', 'hiding', 'various'] as const).some((key) => {
    const names = new Set([...before[key].keys(), ...after[key].keys()]);

    return Array.from(names).some((name) => {
      const left = before[key].get(name);
      const right = after[key].get(name);

      if (left === right) {
        return false;
      }

      if (left === undefined || right === undefined) {
        return true;
      }

      const indexes = changedIndexes(left, right);

      return indexes === null || indexes.some(isChanged);
    });
  });
}

/**
 * Tells whether the column order and trims a restore writes back for a step that inserted or removed
 * rows name a column that changed. Such a restore resets both axes to the physical order and writes
 * the recorded order and trims back, whether or not the step changed them.
 *
 * @param {IndexMapperSnapshot} snapshot The column axis on one side of the step.
 * @param {Function} isChanged The column test.
 * @returns {boolean}
 */
function forcesColumnOrder(snapshot: IndexMapperSnapshot, isChanged: ColumnChangeTest): boolean {
  if (snapshot.sequence.kind !== 'default') {
    return true;
  }

  return Array.from(snapshot.trimming.values()).some((map) => {
    const entries = readEntries(map);

    return entries === null || Array.from(entries.keys()).some(isChanged);
  });
}

/**
 * Tells whether a recorded step addresses a column that changed – so restoring it after a `columns`
 * settings update would put a value, a cell meta key, or a column state on another field's column.
 * A cell write is recorded by prop and addresses no column. A column insert or removal addresses the
 * whole axis, and so does a part of the state that cannot be read per column.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {StepRecord} record The step.
 * @param {Function} isChanged The column test.
 * @returns {boolean}
 */
export function addressesChangedColumn(hot: HotInstance, record: StepRecord, isChanged: ColumnChangeTest): boolean {
  const { before, after, journal } = record;
  let structural = false;

  const journalHit = journal.some((op) => {
    switch (op.type) {
      case 'insertColumns':
      case 'removeColumns':
        return true;
      case 'meta':
        return isChanged(op.physicalColumn);
      case 'removeRows':
        structural = true;

        return op.metas.some(meta => isChanged(meta.physicalColumn)) ||
          op.accessorValues.some(values => values.some(([physicalColumn]) => isChanged(physicalColumn)));
      case 'insertRows':
        structural = true;

        return false;
      case 'metaRows':
        return op.metas.some(meta => isChanged(meta.physicalColumn));
      default:
        return false;
    }
  });

  if (
    journalHit ||
    changesColumnMaps(before.columns, after.columns, isChanged) ||
    (structural && (forcesColumnOrder(before.columns, isChanged) || forcesColumnOrder(after.columns, isChanged))) ||
    before.settings.fixedColumnsStart !== after.settings.fixedColumnsStart ||
    // A settings snapshot is a new object whenever any of its settings changed, headers included.
    JSON.stringify(before.settings.colHeaders) !== JSON.stringify(after.settings.colHeaders)
  ) {
    return true;
  }

  const pluginNames = new Set([...before.plugins.keys(), ...after.plugins.keys()]);

  return Array.from(pluginNames).some((pluginName) => {
    const state = before.plugins.get(pluginName);
    const other = after.plugins.get(pluginName);

    if (state === other) {
      return false;
    }

    const plugin: BasePlugin | undefined = hot.getPlugin(pluginName);
    const columns = plugin?.getStateColumns?.(state, other) ?? null;

    return columns === null || columns.some(isChanged);
  });
}
