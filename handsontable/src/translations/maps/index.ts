import { HidingMap } from './hidingMap';
import { IndexMap } from './indexMap';
import { LinkedPhysicalIndexToValueMap } from './linkedPhysicalIndexToValueMap';
import { PhysicalIndexToValueMap } from './physicalIndexToValueMap';
import { TrimmingMap } from './trimmingMap';
import { IndexValue } from '../types';

export * from './indexesSequence';
export * from './utils/indexesSequence';
export {
  HidingMap,
  IndexMap,
  LinkedPhysicalIndexToValueMap,
  PhysicalIndexToValueMap,
  TrimmingMap
};

// Use any type to avoid compatibility issues with different constructor signatures
const availableIndexMapTypes = new Map<string, any>([
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
export function createIndexMap(mapType: string, initValueOrFn: IndexValue | ((index: number) => IndexValue) | null = null): IndexMap {
  if (!availableIndexMapTypes.has(mapType)) {
    throw new Error(`The provided map type ("${mapType}") does not exist.`);
  }

  const MapConstructor = availableIndexMapTypes.get(mapType);
  return new MapConstructor(initValueOrFn);
}
