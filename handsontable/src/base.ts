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
  reinitTheme,
} from './themes/registry';
import type { HotInstance } from './core/types';
import type { GridSettings as GridSettingsType } from './core/settings';
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
 * Interface describing the Handsontable factory function and static members.
 * Allows both `Handsontable(elem, opts)` and `new Handsontable(elem, opts)`.
 *
 * Covers both access patterns:
 *   - UMD/namespace: `Handsontable.editors.DateEditor`, `Handsontable.plugins.AutoColumnSize`
 *   - ESM/modular:   `import { DateEditor } from 'handsontable/editors'`
 */
interface HandsontableFactory {
  (rootElement: HTMLElement, userSettings?: GridSettingsType): HotInstance;
  new(rootElement: HTMLElement, userSettings?: GridSettingsType): HotInstance;
  Core: new (rootElement: HTMLElement, userSettings?: GridSettingsType) => HotInstance;
  DefaultSettings: Record<string, unknown>;
  hooks: Hooks;
  CellCoords: typeof CellCoords;
  CellRange: typeof CellRange;
  packageName: string;
  buildDate: string | undefined;
  version: string | undefined;
  languages: {
    dictionaryKeys: unknown;
    getLanguageDictionary: (languageCode: string) => object | null;
    getLanguagesDictionaries: () => object[];
    registerLanguageDictionary: (
      languageCodeOrDictionary: string | Record<string, unknown>, dictionary?: Record<string, unknown>
    ) => object;
    getTranslatedPhrase: (
      languageCode: string, dictionaryKey: string, argumentsForFormatters?: unknown
    ) => string | null;
    [key: string]: unknown;
  };
  /** Editor constructors accessible via the UMD namespace pattern. */
  editors: {
    AutocompleteEditor: typeof import('./editors/autocompleteEditor').AutocompleteEditor;
    BaseEditor: typeof BaseEditor;
    CheckboxEditor: typeof import('./editors/checkboxEditor').CheckboxEditor;
    DateEditor: typeof import('./editors/dateEditor').DateEditor;
    DropdownEditor: typeof import('./editors/dropdownEditor').DropdownEditor;
    HandsontableEditor: typeof import('./editors/handsontableEditor').HandsontableEditor;
    IntlDateEditor: typeof import('./editors/intlDateEditor').IntlDateEditor;
    IntlTimeEditor: typeof import('./editors/intlTimeEditor').IntlTimeEditor;
    MultiSelectEditor: typeof import('./editors/multiSelectEditor').MultiSelectEditor;
    NumericEditor: typeof import('./editors/numericEditor').NumericEditor;
    PasswordEditor: typeof import('./editors/passwordEditor').PasswordEditor;
    SelectEditor: typeof import('./editors/selectEditor').SelectEditor;
    TextEditor: typeof TextEditor;
    TimeEditor: typeof import('./editors/timeEditor').TimeEditor;
    registerEditor: typeof import('./editors/registry').registerEditor;
    getEditor: typeof import('./editors/registry').getEditor;
    editorFactory: typeof import('./editors/factory').editorFactory;
    [key: string]: unknown;
  };
  dom: typeof import('./helpers/dom/element') & typeof import('./helpers/dom/event');
  helper:
    typeof import('./helpers/array') &
    typeof import('./helpers/browser') &
    typeof import('./helpers/data') &
    typeof import('./helpers/dateTime') &
    typeof import('./helpers/errors') &
    typeof import('./helpers/feature') &
    typeof import('./helpers/function') &
    typeof import('./helpers/mixed') &
    typeof import('./helpers/number') &
    typeof import('./helpers/object') &
    typeof import('./helpers/string') &
    typeof import('./helpers/unicode') &
    typeof import('./utils/parseTable');
  themes: {
    hasTheme: typeof import('./themes/registry').hasTheme;
    getTheme: typeof import('./themes/registry').getTheme;
    getThemeNames: typeof import('./themes/registry').getThemeNames;
    getThemes: typeof import('./themes/registry').getThemes;
    registerTheme: typeof import('./themes/registry').registerTheme;
    reinitTheme: typeof import('./themes/registry').reinitTheme;
    [key: string]: unknown;
  };
  /** Renderer functions accessible via the UMD namespace pattern. */
  renderers: {
    AutocompleteRenderer: typeof import('./renderers/autocompleteRenderer').autocompleteRenderer;
    BaseRenderer: typeof import('./renderers/baseRenderer').baseRenderer;
    cellDecorator: typeof import('./renderers/baseRenderer').baseRenderer;
    CheckboxRenderer: typeof import('./renderers/checkboxRenderer').checkboxRenderer;
    DateRenderer: typeof import('./renderers/dateRenderer').dateRenderer;
    DropdownRenderer: typeof import('./renderers/dropdownRenderer').dropdownRenderer;
    HandsontableRenderer: typeof import('./renderers/handsontableRenderer').handsontableRenderer;
    HtmlRenderer: typeof import('./renderers/htmlRenderer').htmlRenderer;
    IntlDateRenderer: typeof import('./renderers/intlDateRenderer').intlDateRenderer;
    IntlTimeRenderer: typeof import('./renderers/intlTimeRenderer').intlTimeRenderer;
    NumericRenderer: typeof import('./renderers/numericRenderer').numericRenderer;
    PasswordRenderer: typeof import('./renderers/passwordRenderer').passwordRenderer;
    SelectRenderer: typeof import('./renderers/selectRenderer').selectRenderer;
    TextRenderer: typeof import('./renderers/textRenderer').textRenderer;
    TimeRenderer: typeof import('./renderers/timeRenderer').timeRenderer;
    registerRenderer: typeof import('./renderers/registry').registerRenderer;
    getRenderer: typeof import('./renderers/registry').getRenderer;
    rendererFactory: typeof import('./renderers/factory').rendererFactory;
    [key: string]: unknown;
  };
  /** Validator functions accessible via the UMD namespace pattern. */
  validators: {
    AutocompleteValidator: typeof import('./validators/autocompleteValidator').autocompleteValidator;
    DateValidator: typeof import('./validators/dateValidator').dateValidator;
    DropdownValidator: typeof import('./validators/dropdownValidator').dropdownValidator;
    IntlDateValidator: typeof import('./validators/intlDateValidator').intlDateValidator;
    IntlTimeValidator: typeof import('./validators/intlTimeValidator').intlTimeValidator;
    MultiSelectValidator: typeof import('./validators/multiSelectValidator').multiSelectValidator;
    NumericValidator: typeof import('./validators/numericValidator').numericValidator;
    TimeValidator: typeof import('./validators/timeValidator').timeValidator;
    registerValidator: typeof import('./validators/registry').registerValidator;
    getValidator: typeof import('./validators/registry').getValidator;
    [key: string]: unknown;
  };
  /** Cell type objects accessible via the UMD namespace pattern. */
  cellTypes: {
    autocomplete: typeof import('./cellTypes/autocompleteType').AutocompleteCellType;
    checkbox: typeof import('./cellTypes/checkboxType').CheckboxCellType;
    date: typeof import('./cellTypes/dateType').DateCellType;
    dropdown: typeof import('./cellTypes/dropdownType').DropdownCellType;
    handsontable: typeof import('./cellTypes/handsontableType').HandsontableCellType;
    intlDate: typeof import('./cellTypes/intlDateType').IntlDateCellType;
    intlTime: typeof import('./cellTypes/intlTimeType').IntlTimeCellType;
    numeric: typeof import('./cellTypes/numericType').NumericCellType;
    password: typeof import('./cellTypes/passwordType').PasswordCellType;
    select: typeof import('./cellTypes/selectType').SelectCellType;
    text: typeof import('./cellTypes/textType').TextCellType;
    time: typeof import('./cellTypes/timeType').TimeCellType;
    registerCellType: typeof import('./cellTypes/registry').registerCellType;
    getCellType: typeof import('./cellTypes/registry').getCellType;
    [key: string]: unknown;
  };
  /** Plugin classes accessible via the UMD namespace pattern (keyed by PascalCase convention). */
  plugins: {
    AutoColumnSize: typeof import('./plugins/autoColumnSize').AutoColumnSize;
    Autofill: typeof import('./plugins/autofill').Autofill;
    AutoRowSize: typeof import('./plugins/autoRowSize').AutoRowSize;
    BindRowsWithHeaders: typeof import('./plugins/bindRowsWithHeaders').BindRowsWithHeaders;
    CollapsibleColumns: typeof import('./plugins/collapsibleColumns').CollapsibleColumns;
    ColumnSorting: typeof import('./plugins/columnSorting').ColumnSorting;
    ColumnSummary: typeof import('./plugins/columnSummary').ColumnSummary;
    Comments: typeof import('./plugins/comments').Comments;
    ContextMenu: typeof import('./plugins/contextMenu').ContextMenu;
    CopyPaste: typeof import('./plugins/copyPaste').CopyPaste;
    CustomBorders: typeof import('./plugins/customBorders').CustomBorders;
    DataProvider: typeof import('./plugins/dataProvider').DataProvider;
    Dialog: typeof import('./plugins/dialog').Dialog;
    DragToScroll: typeof import('./plugins/dragToScroll').DragToScroll;
    DropdownMenu: typeof import('./plugins/dropdownMenu').DropdownMenu;
    EmptyDataState: typeof import('./plugins/emptyDataState').EmptyDataState;
    ExportFile: typeof import('./plugins/exportFile').ExportFile;
    Filters: typeof import('./plugins/filters').Filters;
    Formulas: typeof import('./plugins/formulas').Formulas;
    HiddenColumns: typeof import('./plugins/hiddenColumns').HiddenColumns;
    HiddenRows: typeof import('./plugins/hiddenRows').HiddenRows;
    Loading: typeof import('./plugins/loading').Loading;
    ManualColumnFreeze: typeof import('./plugins/manualColumnFreeze').ManualColumnFreeze;
    ManualColumnMove: typeof import('./plugins/manualColumnMove').ManualColumnMove;
    ManualColumnResize: typeof import('./plugins/manualColumnResize').ManualColumnResize;
    ManualRowMove: typeof import('./plugins/manualRowMove').ManualRowMove;
    ManualRowResize: typeof import('./plugins/manualRowResize').ManualRowResize;
    MergeCells: typeof import('./plugins/mergeCells').MergeCells;
    MultiColumnSorting: typeof import('./plugins/multiColumnSorting').MultiColumnSorting;
    MultipleSelectionHandles: typeof import('./plugins/multipleSelectionHandles').MultipleSelectionHandles;
    NestedHeaders: typeof import('./plugins/nestedHeaders').NestedHeaders;
    NestedRows: typeof import('./plugins/nestedRows').NestedRows;
    Notification: typeof import('./plugins/notification').Notification;
    Pagination: typeof import('./plugins/pagination').Pagination;
    Search: typeof import('./plugins/search').Search;
    StretchColumns: typeof import('./plugins/stretchColumns').StretchColumns;
    TouchScroll: typeof import('./plugins/touchScroll').TouchScroll;
    TrimRows: typeof import('./plugins/trimRows').TrimRows;
    UndoRedo: typeof import('./plugins/undoRedo').UndoRedo;
    registerPlugin: typeof import('./plugins/registry').registerPlugin;
    getPlugin: typeof import('./plugins/registry').getPlugin;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Core is a constructor function (not a class). This interface provides a
 * proper `new` signature so TypeScript allows `new Core(...)`.
 */
interface CoreConstructor {
  new(
    rootElement: HTMLElement, userSettings: Record<string, unknown>, rootInstanceSymbol?: symbol | boolean
  ): HotInstance;
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
// Cast: base package only seeds BaseEditor/TextEditor; index.ts fills the rest at runtime.
Handsontable.editors = {
  BaseEditor,
  TextEditor,
} as unknown as HandsontableFactory['editors'];
Handsontable.dom = { empty } as unknown as HandsontableFactory['dom'];
Handsontable.helper = {} as unknown as HandsontableFactory['helper'];
Handsontable.Core = function(
  this: HotInstance,
  rootElement: HTMLElement,
  userSettings: Record<string, unknown> = {}
) {
  return new CoreClass(rootElement, userSettings, rootInstanceSymbol);
} as unknown as HandsontableFactory['Core'];
Handsontable.DefaultSettings = metaSchemaFactory();
Handsontable.hooks = Hooks.getSingleton();
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
  reinitTheme,
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
    export type AutocompleteEditor = import('./editors/autocompleteEditor').AutocompleteEditor;
    export type BaseEditor = import('./editors/baseEditor').BaseEditor;
    export type CheckboxEditor = import('./editors/checkboxEditor').CheckboxEditor;
    export type DateEditor = import('./editors/dateEditor').DateEditor;
    export type DropdownEditor = import('./editors/dropdownEditor').DropdownEditor;
    export type HandsontableEditor = import('./editors/handsontableEditor').HandsontableEditor;
    export type IntlDateEditor = import('./editors/intlDateEditor').IntlDateEditor;
    export type IntlTimeEditor = import('./editors/intlTimeEditor').IntlTimeEditor;
    export type MultiSelectEditor = import('./editors/multiSelectEditor').MultiSelectEditor;
    export type NumericEditor = import('./editors/numericEditor').NumericEditor;
    export type PasswordEditor = import('./editors/passwordEditor').PasswordEditor;
    export type SelectEditor = import('./editors/selectEditor').SelectEditor;
    export type TextEditor = import('./editors/textEditor').TextEditor;
    export type TimeEditor = import('./editors/timeEditor').TimeEditor;
  }

  export namespace cellTypes {
    export type autocomplete = typeof import('./cellTypes/autocompleteType').AutocompleteCellType;
    export type checkbox = typeof import('./cellTypes/checkboxType').CheckboxCellType;
    export type date = typeof import('./cellTypes/dateType').DateCellType;
    export type dropdown = typeof import('./cellTypes/dropdownType').DropdownCellType;
    export type handsontable = typeof import('./cellTypes/handsontableType').HandsontableCellType;
    export type intlDate = typeof import('./cellTypes/intlDateType').IntlDateCellType;
    export type intlTime = typeof import('./cellTypes/intlTimeType').IntlTimeCellType;
    export type numeric = typeof import('./cellTypes/numericType').NumericCellType;
    export type password = typeof import('./cellTypes/passwordType').PasswordCellType;
    export type select = typeof import('./cellTypes/selectType').SelectCellType;
    export type text = typeof import('./cellTypes/textType').TextCellType;
    export type time = typeof import('./cellTypes/timeType').TimeCellType;
  }

  export namespace renderers {
    export type AutocompleteRenderer = typeof import('./renderers/autocompleteRenderer').autocompleteRenderer;
    export type BaseRenderer = import('./renderers/baseRenderer').BaseRenderer;
    export type cellDecorator = import('./renderers/baseRenderer').BaseRenderer;
    export type CheckboxRenderer = typeof import('./renderers/checkboxRenderer').checkboxRenderer;
    export type DateRenderer = typeof import('./renderers/dateRenderer').dateRenderer;
    export type DropdownRenderer = typeof import('./renderers/dropdownRenderer').dropdownRenderer;
    export type HandsontableRenderer = typeof import('./renderers/handsontableRenderer').handsontableRenderer;
    export type HtmlRenderer = typeof import('./renderers/htmlRenderer').htmlRenderer;
    export type IntlDateRenderer = typeof import('./renderers/intlDateRenderer').intlDateRenderer;
    export type IntlTimeRenderer = typeof import('./renderers/intlTimeRenderer').intlTimeRenderer;
    export type NumericRenderer = typeof import('./renderers/numericRenderer').numericRenderer;
    export type PasswordRenderer = typeof import('./renderers/passwordRenderer').passwordRenderer;
    export type SelectRenderer = typeof import('./renderers/selectRenderer').selectRenderer;
    export type TextRenderer = typeof import('./renderers/textRenderer').textRenderer;
    export type TimeRenderer = typeof import('./renderers/timeRenderer').timeRenderer;
  }

  export namespace validators {
    export type AutocompleteValidator = typeof import('./validators/autocompleteValidator').autocompleteValidator;
    export type DateValidator = typeof import('./validators/dateValidator').dateValidator;
    export type DropdownValidator = typeof import('./validators/dropdownValidator').dropdownValidator;
    export type IntlDateValidator = typeof import('./validators/intlDateValidator').intlDateValidator;
    export type IntlTimeValidator = typeof import('./validators/intlTimeValidator').intlTimeValidator;
    export type MultiSelectValidator = typeof import('./validators/multiSelectValidator').multiSelectValidator;
    export type NumericValidator = typeof import('./validators/numericValidator').numericValidator;
    export type TimeValidator = typeof import('./validators/timeValidator').timeValidator;
  }

  export namespace plugins {
    export type AutoColumnSize = import('./plugins/autoColumnSize').AutoColumnSize;
    export type Autofill = import('./plugins/autofill').Autofill;
    export type AutoRowSize = import('./plugins/autoRowSize').AutoRowSize;
    export type BindRowsWithHeaders = import('./plugins/bindRowsWithHeaders').BindRowsWithHeaders;
    export type CollapsibleColumns = import('./plugins/collapsibleColumns').CollapsibleColumns;
    export type ColumnSorting = import('./plugins/columnSorting').ColumnSorting;
    export namespace ColumnSorting {
      export type Config = import('./plugins/columnSorting').ColumnSortingConfig;
    }
    export type ColumnSummary = import('./plugins/columnSummary').ColumnSummary;
    export type Comments = import('./plugins/comments').Comments;
    export type ContextMenu = import('./plugins/contextMenu').ContextMenu;
    export namespace ContextMenu {
      export type PredefinedMenuItemKey = import('./plugins/contextMenu').PredefinedMenuItemKey;
      export type MenuItemConfig = import('./plugins/contextMenu').MenuItemConfig;
    }
    export type CopyPaste = import('./plugins/copyPaste').CopyPaste;
    export type CustomBorders = import('./plugins/customBorders').CustomBorders;
    export namespace CustomBorders {
      export type BorderSettings = import('./plugins/customBorders').BorderSettings;
    }
    export type DataProvider = import('./plugins/dataProvider').DataProvider;
    export namespace DataProvider {
      export type QueryParameters = import('./plugins/dataProvider').DataProviderQueryParameters;
      export type FetchResult = import('./plugins/dataProvider').DataProviderFetchResult;
      export type FetchOptions = import('./plugins/dataProvider').DataProviderFetchOptions;
    }
    export type Dialog = import('./plugins/dialog').Dialog;
    export type DragToScroll = import('./plugins/dragToScroll').DragToScroll;
    export type DropdownMenu = import('./plugins/dropdownMenu').DropdownMenu;
    export type EmptyDataState = import('./plugins/emptyDataState').EmptyDataState;
    export type ExportFile = import('./plugins/exportFile').ExportFile;
    export type Filters = import('./plugins/filters').Filters;
    export namespace Filters {
      export type ConditionId = import('./plugins/filters').ConditionId;
      export type OperationType = import('./plugins/filters').OperationType;
    }
    export type Formulas = import('./plugins/formulas').Formulas;
    export type HiddenColumns = import('./plugins/hiddenColumns').HiddenColumns;
    export type HiddenRows = import('./plugins/hiddenRows').HiddenRows;
    export type Loading = import('./plugins/loading').Loading;
    export type ManualColumnFreeze = import('./plugins/manualColumnFreeze').ManualColumnFreeze;
    export type ManualColumnMove = import('./plugins/manualColumnMove').ManualColumnMove;
    export type ManualColumnResize = import('./plugins/manualColumnResize').ManualColumnResize;
    export type ManualRowMove = import('./plugins/manualRowMove').ManualRowMove;
    export type ManualRowResize = import('./plugins/manualRowResize').ManualRowResize;
    export type MergeCells = import('./plugins/mergeCells').MergeCells;
    export type MultiColumnSorting = import('./plugins/multiColumnSorting').MultiColumnSorting;
    export type MultipleSelectionHandles = import('./plugins/multipleSelectionHandles').MultipleSelectionHandles;
    export type NestedHeaders = import('./plugins/nestedHeaders').NestedHeaders;
    export type NestedRows = import('./plugins/nestedRows').NestedRows;
    export type Notification = import('./plugins/notification').Notification;
    export type Pagination = import('./plugins/pagination').Pagination;
    export type Search = import('./plugins/search').Search;
    export type StretchColumns = import('./plugins/stretchColumns').StretchColumns;
    export type TouchScroll = import('./plugins/touchScroll').TouchScroll;
    export type TrimRows = import('./plugins/trimRows').TrimRows;
    export type UndoRedo = import('./plugins/undoRedo').UndoRedo;
  }
}

export {
  CellCoords,
  CellRange,
};

// Named type exports for user-facing API (mirrors src/index.ts)
// Note: CellCoords and CellRange are already exported as runtime values above.
export type { GridSettings, Events } from './core/settings';
export type {
  CellValue, CellChange, RowObject, SourceRowData, ChangeSource, NumericFormatOptions, CellMeta, CellProperties,
  ColumnSettings
} from './settings';
export type { RangeType, HotInstance } from './core/types';
export type { OverlayType } from './3rdparty/walkontable/src/types';
export type { BaseEditor as BaseEditorInstance } from './editors/baseEditor/baseEditor';
export { IndexMapper } from './translations';
export type { SelectOptionsObject } from './settings';
export type { CellType } from './cellTypes/registry';
export type { EditorType } from './editors/registry';
export type { RendererType } from './renderers/registry';
export type { ValidatorType } from './validators/registry';
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
