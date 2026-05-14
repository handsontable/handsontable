import Core from './core';
import { rootInstanceSymbol } from './utils/rootInstance';
import { metaSchemaFactory } from './dataMap';
import { Hooks } from './core/hooks';

// FIXME: Bug in eslint-plugin-import: https://github.com/benmosher/eslint-plugin-import/issues/1883
/* eslint-disable import/named */
import {
  dictionaryKeys,
  getTranslatedPhrase,
  registerLanguageDictionary,
  getLanguagesDictionaries,
  getLanguageDictionary
} from './i18n/registry';
/* eslint-enable import/named */
import { registerCellType } from './cellTypes/registry';
import { registerRenderer } from './renderers/registry';
import { baseRenderer } from './renderers/baseRenderer';
import { TextCellType } from './cellTypes/textType';
import { BaseEditor } from './editors/baseEditor';
import { CellCoords, CellRange } from './3rdparty/walkontable/src';
import {
  hasTheme,
  getTheme,
  getThemeNames,
  getThemes,
  registerTheme,
} from './themes/registry';
import type { HotInstance, GridSettings as GridSettingsType } from './common';
import type {
  ColumnSettings as ColumnSettingsType,
  CellProperties as CellPropertiesType,
  CellMeta as CellMetaType,
  NumericFormatOptions as NumericFormatOptionsType,
  CellChange as CellChangeType,
  ChangeSource as ChangeSourceType,
  RowObject as RowObjectType,
} from './settings';
import { TextEditor } from './editors/textEditor/textEditor';
import { empty } from './helpers/dom/element';

/**
 * Hook registry interface for Handsontable.hooks (e.g. getRegistered()).
 */
export interface HooksRegistry {
  getRegistered(): string[];
  [key: string]: unknown;
}

/**
 * Core is a constructor function (not a class). This interface provides a
 * proper `new` signature so TypeScript allows `new Core(...)`.
 */
interface CoreConstructor {
  new(rootElement: HTMLElement, userSettings: Record<string, unknown>, rootInstanceSymbol?: symbol | boolean): HotInstance;
}

const CoreClass = Core as unknown as CoreConstructor;

// register default mandatory cell type for the Base package
registerCellType(TextCellType);
registerRenderer(baseRenderer);

/**
 * Handsontable factory function and static namespace.
 * Implemented as a typed const so that declaration emit produces a merge with declare namespace Handsontable.
 */
const Handsontable = (function Handsontable(
  rootElement: HTMLElement,
  userSettings: Record<string, unknown>
): HotInstance {
  const instance = new CoreClass(rootElement, userSettings || {}, rootInstanceSymbol);
  instance.init();
  return instance;
}) as unknown as HandsontableFactory;

// Static members
Handsontable.editors = {
  BaseEditor,
  TextEditor,
};
Handsontable.dom = {
  empty,
};
Handsontable.Core = function(
  this: HotInstance,
  rootElement: HTMLElement,
  userSettings: Record<string, unknown> = {}
) {
  return new CoreClass(rootElement, userSettings, rootInstanceSymbol);
} as unknown as HandsontableFactory['Core'];
Handsontable.DefaultSettings = metaSchemaFactory();
Handsontable.hooks = Hooks.getSingleton() as unknown as HooksRegistry;
Handsontable.CellCoords = CellCoords;
Handsontable.CellRange = CellRange;
Handsontable.packageName = 'handsontable';
Handsontable.buildDate = process.env.HOT_BUILD_DATE;
Handsontable.version = process.env.HOT_VERSION;
Handsontable.languages = {
  dictionaryKeys,
  getLanguageDictionary,
  getLanguagesDictionaries,
  registerLanguageDictionary,
  getTranslatedPhrase,
};
Handsontable.themes = {
  hasTheme,
  getTheme,
  getThemeNames,
  getThemes,
  registerTheme,
};

/**
 * Instance type: when wrappers use "Handsontable" as a type they mean the grid instance (HotInstance).
 */
interface Handsontable extends HotInstance {}

/**
 * Type exports on the Handsontable namespace for wrappers (React, Angular, Vue).
 * Merges with the default export so that Handsontable.ColumnSettings, etc. resolve.
 */
declare namespace Handsontable {
  /** Instance type of the grid (Core). */
  export type Core = HotInstance;
  /** Cell value type (e.g. for getData/getSourceData). */
  export type CellValue = unknown;
  export type GridSettings = GridSettingsType;
  export type ColumnSettings = ColumnSettingsType;
  export type CellProperties = CellPropertiesType;
  /** @deprecated Use CellProperties */
  export type CellMeta = CellMetaType;
  export type NumericFormatOptions = NumericFormatOptionsType;
  export type CellChange = CellChangeType;
  export type ChangeSource = ChangeSourceType;
  export type RowObject = RowObjectType;
  export namespace editors {
    /** Instance type of the BaseEditor class (for refs and type guards). */
    export type BaseEditor = InstanceType<typeof import('./editors/baseEditor').BaseEditor>;
  }
}

/**
 * Interface describing the Handsontable factory function and static members.
 * Allows both `Handsontable(elem, opts)` and `new Handsontable(elem, opts)`.
 */
interface HandsontableFactory {
  (rootElement: HTMLElement, userSettings?: GridSettingsType): HotInstance;
  new(rootElement: HTMLElement, userSettings?: GridSettingsType): HotInstance;
  Core: new (rootElement: HTMLElement, userSettings?: GridSettingsType) => HotInstance;
  DefaultSettings: Record<string, unknown>;
  hooks: HooksRegistry;
  CellCoords: typeof CellCoords;
  CellRange: typeof CellRange;
  packageName: string;
  buildDate: string | undefined;
  version: string | undefined;
  languages: {
    dictionaryKeys: unknown;
    getLanguageDictionary: (languageCode: string) => object;
    getLanguagesDictionaries: () => object[];
    registerLanguageDictionary: (languageCodeOrDictionary: string | Record<string, unknown>, dictionary?: Record<string, unknown>) => object;
    getTranslatedPhrase: (languageCode: string, dictionaryKey: string, argumentsForFormatters?: unknown) => string | null;
    [key: string]: unknown;
  };
  editors: {
    BaseEditor: typeof BaseEditor;
    TextEditor: typeof TextEditor;
    [key: string]: unknown;
  };
  dom: {
    empty: typeof empty;
    [key: string]: unknown;
  };
  themes: Record<string, unknown>;
  renderers: {
    registerRenderer: (name: string, renderer: unknown) => void;
    BaseRenderer: (
      instance: HotInstance,
      td: HTMLTableCellElement,
      row: number,
      col: number,
      prop: string | number,
      value: unknown,
      cellProperties: Record<string, unknown>
    ) => void;
    TextRenderer: (
      instance: HotInstance,
      td: HTMLTableCellElement,
      row: number,
      col: number,
      prop: string | number,
      value: unknown,
      cellProperties: Record<string, unknown>
    ) => void;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export {
  CellCoords,
  CellRange,
};

// Named type exports for user-facing API (mirrors src/index.ts)
// Note: CellCoords and CellRange are already exported as runtime values above.
export type {
  GridSettings, Events, RangeType, OverlayType, HotInstance, BaseEditorInstance,
  CellValue, CellChange, RowObject, SourceRowData, ChangeSource,
  NumericFormatOptions, CellMeta, CellProperties, ColumnSettings,
} from './common';
export type { SelectOptionsObject } from './settings';
export type { CellType } from './cellTypes';
export type { EditorType } from './editors';
export type { RendererType } from './renderers';
export type { ValidatorType } from './validators';
export type {
  BaseTheme,
  ThemeBuilder,
  ThemeColorScheme,
  ThemeColorsConfig,
  ThemeConfig,
  ThemeDensityConfig,
  ThemeDensitySizes,
  ThemeIconsConfig,
  ThemeLightDarkValue,
  ThemeParams,
  ThemeSizingConfig,
  ThemeTokenValue,
  ThemeTokensConfig,
} from './themes';

export default Handsontable;
