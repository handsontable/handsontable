import type { DroppedFeatures } from '../../capabilities';
import type { WorkbookSnapshot } from '../../model';
import type { XlsxEngineAdapter } from '../types';
import { readWorkbook } from './read';
import { writeWorkbook } from './write';

/**
 * The built-in xlsx engine. It needs no injected module: the `module` argument of the adapter
 * contract is ignored, and `detectXlsxEngine` selects this adapter when nothing was injected.
 */
export const nativeAdapter: XlsxEngineAdapter = {
  read(buffer: ArrayBuffer, _module: unknown, dropped: DroppedFeatures): Promise<WorkbookSnapshot> {
    return readWorkbook(buffer, dropped);
  },
  write(snapshot: WorkbookSnapshot, _module: unknown, dropped: DroppedFeatures): Promise<Uint8Array> {
    return writeWorkbook(snapshot, dropped);
  },
};
