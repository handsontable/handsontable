import Selection from './selection';
import { handleMouseEvent } from './mouseEventHandler';
import {
  detectSelectionType,
  normalizeSelectionFactory,
  transformRangeLikeToIndexes,
} from './utils';

export * from './highlight/highlight';
export {
  handleMouseEvent,
  Selection,
  detectSelectionType,
  normalizeSelectionFactory,
  transformRangeLikeToIndexes,
};
