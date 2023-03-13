export * from './highlight/highlight';
import Selection from './selection';
import { handleMouseEvent } from './mouseEventHandler';
import {
  detectSelectionType,
  normalizeSelectionFactory,
} from './utils';

export {
  handleMouseEvent,
  Selection,
  detectSelectionType,
  normalizeSelectionFactory
};
