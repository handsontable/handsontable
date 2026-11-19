import type { DroppedFeatures } from '../capabilities';
import type { DefinedNameSnapshot, WorkbookSnapshot } from '../model';

/**
 * What every engine adapter provides. `module` is the injected library, untyped on purpose: each
 * adapter narrows it to the structural interface it needs.
 */
export interface XlsxEngineAdapter {
  read(buffer: ArrayBuffer, module: unknown, dropped: DroppedFeatures): Promise<WorkbookSnapshot>;
  write(snapshot: WorkbookSnapshot, module: unknown, dropped: DroppedFeatures): Promise<Uint8Array>;
  /**
   * The defined names of `snapshot` that `write` puts into the file, without writing anything.
   * `exportFile` asks it before the write, so a formula over a name the writer leaves out goes out
   * as its value instead of showing `#NAME?` (or another engine's definition) in Excel.
   */
  selectDefinedNames(snapshot: WorkbookSnapshot): DefinedNameSnapshot[];
}
