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
  CellMeta as BaseCellMeta,
  CellProperties as BaseCellProperties,
  ColumnSettings as BaseColumnSettings,
  GridSettings as BaseGridSettings,
  CellValue as BaseCellValue,
  RowObject as BaseRowObject,
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

const baseCellMeta: BaseCellMeta = {};
const baseCellProps: Partial<BaseCellProperties> = {};
const baseColumnSettings: BaseColumnSettings = {};
const baseGridSettings: BaseGridSettings = {};
const baseRowObject: BaseRowObject = {};
const baseCellValue: BaseCellValue = null;

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
