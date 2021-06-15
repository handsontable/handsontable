import Highlight from './highlight/highlight';
import Selection from './selection';
import { handleMouseEvent } from './mouseEventHandler';
import {
  detectSelectionType,
  normalizeSelectionFactory,
} from './utils';

export * from './highlight/constants';
export {
  handleMouseEvent,
  Highlight,
  Selection,
  detectSelectionType,
  normalizeSelectionFactory
};
