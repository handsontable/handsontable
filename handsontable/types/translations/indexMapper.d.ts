import { IndexMap } from './maps/indexMap';

export type MapTypes = 'hidden' | 'index' | 'linkedPhysicalIndexToValue' | 'physicalIndexToValue' | 'trimming';

export interface ChangesEventData {
  op: 'replace' | 'insert' | 'remove';
  index: number;
  oldValue: any;
  newValue: any;
}

export interface ChangesObserver {
  subscribe(callback: (changes: ChangesEventData[]) => void): ChangesObserver;
  unsubscribe(): ChangesObserver;
}

export class IndexMapper {
  suspendOperations(): void;
  resumeOperations(): void;
  createChangesObserver(indexMapType: 'hiding'): ChangesObserver;
  createAndRegisterIndexMap(indexName: string, mapType: MapTypes, initValueOrFn?: any): IndexMap;
  registerMap(uniqueName: string, indexMap: IndexMap): IndexMap;
  unregisterMap(name: string): void;
  unregisterAll(): void;
  fitToLength(length: number): void;
  getPhysicalFromVisualIndex(visualIndex: number): number;
  getPhysicalFromRenderableIndex(renderableIndex: number): number;
  getVisualFromPhysicalIndex(physicalIndex: number): number;
  getVisualFromRenderableIndex(renderableIndex: number): number;
  getRenderableFromVisualIndex(visualIndex: number): number;
  getNearestNotHiddenIndex(fromVisualIndex: number, searchDirection: 1 | -1,
    searchAlsoOtherWayAround?: boolean): number | null;
  initToLength(length?: number): void;
  getIndexesSequence(): number[];
  setIndexesSequence(indexes: number[]): void;
  getNotTrimmedIndexes(readFromCache?: boolean): number[];
  getNotTrimmedIndexesLength(): number;
  getNotHiddenIndexes(readFromCache?: boolean): number[];
  getNotHiddenIndexesLength(): number;
  getRenderableIndexes(readFromCache?: boolean): number[];
  getRenderableIndexesLength(): number;
  getNumberOfIndexes(): number;
  moveIndexes(movedIndexes: number | number[], finalIndex: number): void;
  isTrimmed(physicalIndex: number): boolean;
  isHidden(physicalIndex: number): boolean;
}
