import { HidingMap } from './hidingMap';
import { IndexMap } from './indexMap';
import { LinkedPhysicalIndexToValueMap } from './linkedPhysicalIndexToValueMap';
import { PhysicalIndexToValueMap } from './physicalIndexToValueMap';
import { TrimmingMap } from './trimmingMap';
import { throwWithCause } from '../../helpers/errors';

export * from './indexesSequence';
export * from './utils/indexesSequence';
export {
  HidingMap,
  IndexMap,
  LinkedPhysicalIndexToValueMap,
  PhysicalIndexToValueMap,
  TrimmingMap
};

const availableIndexMapTypes = new Map<string, typeof IndexMap>([
  ['hiding', HidingMap],
  ['index', IndexMap],
  ['linkedPhysicalIndexToValue', LinkedPhysicalIndexToValueMap],
  ['physicalIndexToValue', PhysicalIndexToValueMap],
  ['trimming', TrimmingMap],
]);

/**
 * Creates and returns new IndexMap instance.
 *
 * @param {string} mapType The type of the map.
 * @param {*} [initValueOrFn=null] Initial value or function for index map.
 * @returns {IndexMap}
 */
export function createIndexMap(mapType: string, initValueOrFn: unknown = null) {
  if (!availableIndexMapTypes.has(mapType)) {
    throwWithCause(`The provided map type ("${mapType}") does not exist.`);
  }

  return new (availableIndexMapTypes.get(mapType)!)(initValueOrFn);
}
