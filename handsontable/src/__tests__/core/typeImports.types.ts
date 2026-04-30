// Verifies that commonly-needed types are importable as named top-level
// exports from both the main `handsontable` entry and the tree-shakeable
// `handsontable/base` entry. Regression test for issue #11240.

import {
  CellChange,
  CellMeta,
  CellProperties,
  CellType,
  CellValue,
  ChangeSource,
  ColumnSettings,
  EditorType,
  GridSettings,
  NumericFormatOptions,
  RendererType,
  RowObject,
  SelectOptionsObject,
  SourceRowData,
  ValidatorType,
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
} from 'handsontable';

import {
  CellChange as BaseCellChange,
  CellMeta as BaseCellMeta,
  CellProperties as BaseCellProperties,
  CellType as BaseCellType,
  CellValue as BaseCellValue,
  ChangeSource as BaseChangeSource,
  ColumnSettings as BaseColumnSettings,
  EditorType as BaseEditorType,
  GridSettings as BaseGridSettings,
  NumericFormatOptions as BaseNumericFormatOptions,
  RendererType as BaseRendererType,
  RowObject as BaseRowObject,
  SelectOptionsObject as BaseSelectOptionsObject,
  SourceRowData as BaseSourceRowData,
  ValidatorType as BaseValidatorType,
  BaseTheme as BaseBaseTheme,
  ThemeBuilder as BaseThemeBuilder,
  ThemeColorScheme as BaseThemeColorScheme,
  ThemeColorsConfig as BaseThemeColorsConfig,
  ThemeConfig as BaseThemeConfig,
  ThemeDensityConfig as BaseThemeDensityConfig,
  ThemeDensitySizes as BaseThemeDensitySizes,
  ThemeIconsConfig as BaseThemeIconsConfig,
  ThemeLightDarkValue as BaseThemeLightDarkValue,
  ThemeParams as BaseThemeParams,
  ThemeSizingConfig as BaseThemeSizingConfig,
  ThemeTokenValue as BaseThemeTokenValue,
  ThemeTokensConfig as BaseThemeTokensConfig,
} from 'handsontable/base';

const cellMeta: CellMeta = {};
const cellProps: Partial<CellProperties> = {};
const columnSettings: ColumnSettings = {};
const gridSettings: GridSettings = {};
const rowObject: RowObject = { foo: 'bar' };
const cellValue: CellValue = 'x';
const sourceRow: SourceRowData = [1, 2, 3];
const changeSource: ChangeSource = 'edit';
const cellChange: CellChange = [0, 0, null, 'next'];
const selectOptions: SelectOptionsObject = { key: 'value' };

let cellType: CellType | null = null;
let editorType: EditorType | null = null;
let rendererType: RendererType | null = null;
let validatorType: ValidatorType | null = null;
let numericFormat: NumericFormatOptions | null = null;
let baseTheme: BaseTheme | null = null;
let themeBuilder: ThemeBuilder | null = null;
let themeColorScheme: ThemeColorScheme | null = null;
let themeColorsConfig: ThemeColorsConfig | null = null;
let themeConfig: ThemeConfig | null = null;
let themeDensityConfig: ThemeDensityConfig | null = null;
let themeDensitySizes: ThemeDensitySizes | null = null;
let themeIconsConfig: ThemeIconsConfig | null = null;
let themeLightDarkValue: ThemeLightDarkValue | null = null;
let themeParams: ThemeParams | null = null;
let themeSizingConfig: ThemeSizingConfig | null = null;
let themeTokenValue: ThemeTokenValue | null = null;
let themeTokensConfig: ThemeTokensConfig | null = null;

const baseCellMeta: BaseCellMeta = {};
const baseCellProps: Partial<BaseCellProperties> = {};
const baseColumnSettings: BaseColumnSettings = {};
const baseGridSettings: BaseGridSettings = {};
const baseRowObject: BaseRowObject = { foo: 'bar' };
const baseCellValue: BaseCellValue = 'x';
const baseSourceRow: BaseSourceRowData = [1, 2, 3];
const baseChangeSource: BaseChangeSource = 'edit';
const baseCellChange: BaseCellChange = [0, 0, null, 'next'];
const baseSelectOptions: BaseSelectOptionsObject = { key: 'value' };

let baseCellType: BaseCellType | null = null;
let baseEditorType: BaseEditorType | null = null;
let baseRendererType: BaseRendererType | null = null;
let baseValidatorType: BaseValidatorType | null = null;
let baseNumericFormat: BaseNumericFormatOptions | null = null;
let baseBaseTheme: BaseBaseTheme | null = null;
let baseThemeBuilder: BaseThemeBuilder | null = null;
let baseThemeColorScheme: BaseThemeColorScheme | null = null;
let baseThemeColorsConfig: BaseThemeColorsConfig | null = null;
let baseThemeConfig: BaseThemeConfig | null = null;
let baseThemeDensityConfig: BaseThemeDensityConfig | null = null;
let baseThemeDensitySizes: BaseThemeDensitySizes | null = null;
let baseThemeIconsConfig: BaseThemeIconsConfig | null = null;
let baseThemeLightDarkValue: BaseThemeLightDarkValue | null = null;
let baseThemeParams: BaseThemeParams | null = null;
let baseThemeSizingConfig: BaseThemeSizingConfig | null = null;
let baseThemeTokenValue: BaseThemeTokenValue | null = null;
let baseThemeTokensConfig: BaseThemeTokensConfig | null = null;
