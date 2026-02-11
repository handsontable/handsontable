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
import type { HotInstance } from './common';
import type { GridSettings as _GridSettings } from './common';

export { _CellCoords as CellCoords, _CellRange as CellRange };

/**
 * Handsontable instance type. Uses permissive index signature so any
 * value can be assigned to/from it (matching the original hand-written types).
 */
interface Handsontable {
  [key: string]: any;
}

/**
 * Constructor interface for Handsontable.
 */
interface HandsontableConstructor {
  new (rootElement: HTMLElement, userSettings?: Record<string, unknown>): Handsontable;
  (rootElement: HTMLElement, userSettings?: Record<string, unknown>): Handsontable;
  Core: {
    new (rootElement: HTMLElement, userSettings?: Record<string, unknown>): Handsontable;
    (rootElement: HTMLElement, userSettings?: Record<string, unknown>): Handsontable;
  };
  DefaultSettings: Record<string, unknown>;
  hooks: { getRegistered(): string[]; getSingleton(): any; [key: string]: any };
  CellCoords: typeof _CellCoords;
  CellRange: typeof _CellRange;
  packageName: string;
  buildDate: string | undefined;
  version: string | undefined;
  languages: Record<string, unknown>;
  themes: Record<string, unknown>;
  editors: {
    BaseEditor: typeof _BaseEditor;
    [key: string]: unknown;
  };
  renderers: {
    registerRenderer(name: string, renderer: any): void;
    [key: string]: unknown;
  };
  [key: string]: any;
}

declare const Handsontable: HandsontableConstructor;

declare namespace Handsontable {
  type GridSettings = _GridSettings;
  type ColumnSettings = Record<string, unknown>;
  type CellProperties = Record<string, unknown>;
  type Core = Handsontable;
  type BaseEditor = _BaseEditor;
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
