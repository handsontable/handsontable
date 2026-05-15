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

const cellType: CellType | null = null;
const editorType: EditorType | null = null;
const rendererType: RendererType | null = null;
const validatorType: ValidatorType | null = null;
const numericFormat: NumericFormatOptions | null = null;
const baseTheme: BaseTheme | null = null;
const themeBuilder: ThemeBuilder | null = null;
const themeColorScheme: ThemeColorScheme | null = null;
const themeColorsConfig: ThemeColorsConfig | null = null;
const themeConfig: ThemeConfig | null = null;
const themeDensityConfig: ThemeDensityConfig | null = null;
const themeDensitySizes: ThemeDensitySizes | null = null;
const themeIconsConfig: ThemeIconsConfig | null = null;
const themeLightDarkValue: ThemeLightDarkValue | null = null;
const themeParams: ThemeParams | null = null;
const themeSizingConfig: ThemeSizingConfig | null = null;
const themeTokenValue: ThemeTokenValue | null = null;
const themeTokensConfig: ThemeTokensConfig | null = null;

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

const baseCellType: BaseCellType | null = null;
const baseEditorType: BaseEditorType | null = null;
const baseRendererType: BaseRendererType | null = null;
const baseValidatorType: BaseValidatorType | null = null;
const baseNumericFormat: BaseNumericFormatOptions | null = null;
const baseBaseTheme: BaseBaseTheme | null = null;
const baseThemeBuilder: BaseThemeBuilder | null = null;
const baseThemeColorScheme: BaseThemeColorScheme | null = null;
const baseThemeColorsConfig: BaseThemeColorsConfig | null = null;
const baseThemeConfig: BaseThemeConfig | null = null;
const baseThemeDensityConfig: BaseThemeDensityConfig | null = null;
const baseThemeDensitySizes: BaseThemeDensitySizes | null = null;
const baseThemeIconsConfig: BaseThemeIconsConfig | null = null;
const baseThemeLightDarkValue: BaseThemeLightDarkValue | null = null;
const baseThemeParams: BaseThemeParams | null = null;
const baseThemeSizingConfig: BaseThemeSizingConfig | null = null;
const baseThemeTokenValue: BaseThemeTokenValue | null = null;
const baseThemeTokensConfig: BaseThemeTokensConfig | null = null;
