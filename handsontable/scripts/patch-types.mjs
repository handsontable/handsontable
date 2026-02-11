/**
 * Post-build script to patch generated declaration files.
 *
 * After `tsc --emitDeclarationOnly` generates .d.ts files into tmp/,
 * this script replaces tmp/base.d.ts with a comprehensive declaration that
 * supports all usage patterns the wrappers need.
 *
 * 1. As a type: `instance: Handsontable` (Core instance).
 * 2. As a namespace: `Handsontable.GridSettings`, `Handsontable.CellProperties`.
 * 3. As a value: `Handsontable.Core(el)`, `Handsontable.hooks`, `Handsontable.editors.BaseEditor`.
 * 4. As a callable: `new Handsontable(el, opts)` / `Handsontable(el, opts)`.
 *
 * Uses interface + const + namespace declaration merging.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TMP_DIR = join(import.meta.dirname, '..', 'tmp');

// ─── Patch base.d.ts ────────────────────────────────────────────────────────

const baseDtsPath = join(TMP_DIR, 'base.d.ts');

const baseDts = `\
import { CellCoords as _CellCoords } from './3rdparty/walkontable/src';
import { CellRange as _CellRange } from './3rdparty/walkontable/src';
import { BaseEditor as _BaseEditor } from './editors/baseEditor';
import type { BaseRenderer as _BaseRenderer } from './renderers';
import type { HotInstance } from './common';
import type { GridSettings as _GridSettings } from './common';

export { _CellCoords as CellCoords, _CellRange as CellRange };

/**
 * Handsontable class declaration that supports all wrapper usage patterns.
 * Uses class + namespace merging so export default preserves the namespace.
 */
declare class Handsontable {
  constructor(rootElement: HTMLElement, userSettings?: Record<string, unknown>);
  [key: string]: any;
}

declare namespace Handsontable {
  // Type aliases
  type GridSettings = _GridSettings;
  type ColumnSettings = Record<string, unknown>;
  type CellProperties = Record<string, unknown>;
  type CellValue = any;
  type BaseEditor = _BaseEditor;

  // Core — usable both as a type (Handsontable.Core) and value (new Handsontable.Core(...))
  type Core = Handsontable;
  const Core: {
    new (rootElement: HTMLElement, userSettings?: Record<string, unknown>): Handsontable;
    (rootElement: HTMLElement, userSettings?: Record<string, unknown>): Handsontable;
  };
  const DefaultSettings: Record<string, unknown>;
  const hooks: { getRegistered(): string[]; getSingleton(): any; [key: string]: any };
  const CellCoords: typeof _CellCoords;
  const CellRange: typeof _CellRange;
  const packageName: string;
  const buildDate: string | undefined;
  const version: string | undefined;
  const languages: Record<string, unknown>;
  const themes: Record<string, unknown>;

  // Sub-namespaces (for Handsontable.editors.BaseEditor, Handsontable.renderers.BaseRenderer)
  namespace editors {
    class BaseEditor {
      constructor(hotInstance: any);
      hot: any;
      state: string;
      getValue(): any;
      setValue(newValue: any): void;
      open(): void;
      close(): void;
      focus(): void;
      isOpened(): boolean;
      prepare(
        row: number, col: number, prop: string | number,
        TD: HTMLTableCellElement, originalValue: any,
        cellProperties: Record<string, any>,
      ): void;
      finishEditing(restoreOriginalValue?: boolean, ctrlDown?: boolean, callback?: () => void): void;
      row: number;
      col: number;
      prop: number | string;
      TD: HTMLTableCellElement;
      cellProperties: Record<string, any>;
      [key: string]: any;
    }
  }

  namespace renderers {
    const BaseRenderer: _BaseRenderer;
    function registerRenderer(name: string, renderer: any): void;
    function rendererFactory(params: Record<string, unknown>): any;
  }
}

export default Handsontable;
`;

writeFileSync(baseDtsPath, baseDts, 'utf-8');
console.log('Patched tmp/base.d.ts');

// ─── Patch core.d.ts ────────────────────────────────────────────────────────
// The wrapper does `import Core from 'handsontable/core'` and uses Core as a type.
// The generated core.d.ts exports `function Core(...)` — a value, not usable as a type.
// We replace it with an interface + const pattern so it works as both.

const coreDtsPath = join(TMP_DIR, 'core.d.ts');
const coreDts = `\
/**
 * Core type that can be used both as a value (constructor) and as a type (instance).
 */
interface Core {
  [key: string]: any;
}

declare const Core: {
  new (rootElement: HTMLElement, userSettings?: Record<string, unknown>): Core;
  (rootElement: HTMLElement, userSettings?: Record<string, unknown>): Core;
};

export default Core;
`;

writeFileSync(coreDtsPath, coreDts, 'utf-8');
console.log('Patched tmp/core.d.ts');

// ─── Patch editors/factory.d.ts ─────────────────────────────────────────────
// Add type parameter to editorFactory so wrapper can call editorFactory<T>({...})

const factoryDtsPath = join(TMP_DIR, 'editors', 'factory.d.ts');
let factoryDts = readFileSync(factoryDtsPath, 'utf-8');

// Replace the non-generic declaration with a generic one
factoryDts = factoryDts.replace(
  /export declare const editorFactory: \([^)]*\) => unknown;/,
  'export declare const editorFactory: <T = unknown>(params: Record<string, unknown>) => T;'
);

writeFileSync(factoryDtsPath, factoryDts, 'utf-8');
console.log('Patched tmp/editors/factory.d.ts');
