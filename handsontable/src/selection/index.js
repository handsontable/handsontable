import Selection from './selection';
import { handleMouseEvent } from './mouseEventHandler';
import {
  detectSelectionType,
  normalizeSelectionFactory,
  normalizeRanges,
} from './utils';

export * from './highlight/highlight';
export {
  handleMouseEvent,
  Selection,
  detectSelectionType,
  normalizeSelectionFactory,
  normalizeRanges,
};
