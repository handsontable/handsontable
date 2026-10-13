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
  /**
   * Reads `.xlsx` bytes into a workbook snapshot, recording what the file carried and the model
   * cannot hold. Every declared limit refuses the file before the allocation it asks for.
   */
  read(buffer: ArrayBuffer, _module: unknown, dropped: DroppedFeatures): Promise<WorkbookSnapshot> {
    return readWorkbook(buffer, dropped);
  },
  /**
   * Serializes a workbook snapshot into `.xlsx` bytes, recording what the snapshot asked for and
   * this engine cannot write. Only the compression and the sheet-password hash are asynchronous.
   */
  write(snapshot: WorkbookSnapshot, _module: unknown, dropped: DroppedFeatures): Promise<Uint8Array> {
    return writeWorkbook(snapshot, dropped);
  },
};
