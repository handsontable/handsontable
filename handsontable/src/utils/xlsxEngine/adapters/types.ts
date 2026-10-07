import type { DroppedFeatures } from '../capabilities';
import type { WorkbookSnapshot } from '../model';

/**
 * What every engine adapter provides. `module` is the injected library, untyped on purpose: each
 * adapter narrows it to the structural interface it needs.
 */
export interface XlsxEngineAdapter {
  read(buffer: ArrayBuffer, module: unknown, dropped: DroppedFeatures): Promise<WorkbookSnapshot>;
  write(snapshot: WorkbookSnapshot, module: unknown, dropped: DroppedFeatures): Promise<Uint8Array>;
}
