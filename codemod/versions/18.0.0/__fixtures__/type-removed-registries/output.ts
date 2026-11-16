// TODO(handsontable-codemod 18.0.0/type-plugins-map): Plugins: Get a typed plugin from the instance with `hot.getPlugin('<key>')`.
import type { Plugins } from 'handsontable/plugins';
// TODO(handsontable-codemod 18.0.0/type-registry-maps): CellTypes: Use the string union that the registry entry points export instead: `CellType`...
import type { CellTypes } from 'handsontable/cellTypes';
// TODO(handsontable-codemod 18.0.0/type-registry-maps): Editors: Use the string union that the registry entry points export instead: `CellType`...
import type { Editors } from 'handsontable/editors';
// TODO(handsontable-codemod 18.0.0/type-registry-maps): Renderers: Use the string union that the registry entry points export instead: `CellType`...
import type { Renderers } from 'handsontable/renderers';
// TODO(handsontable-codemod 18.0.0/type-registry-maps): Validators: Use the string union that the registry entry points export instead: `CellType`...
// TODO(handsontable-codemod 18.0.0/type-validators-basevalidator): BaseValidator: Describe the validator inline: `(this: CellProperties, value: unknown, callback...
import type { BaseValidator, Validators } from 'handsontable/validators';
// TODO(handsontable-codemod 18.0.0/type-editorfactory-shortcut): Shortcut: Describe one shortcut inline, or use `NonNullable<EditorFactoryOptions['shortcuts']>[nu...
import type { Shortcut } from 'handsontable/editors/factory';
// TODO(handsontable-codemod 18.0.0/type-i18n-languagedictionary): LanguageDictionary: Use `Record<string, unknown>`.
import type { LanguageDictionary } from 'handsontable/i18n';
// TODO(handsontable-codemod 18.0.0/type-i18n-languagedictionary): LanguageDictionary: Use `Record<string, unknown>`.
import type { LanguageDictionary as RegistryDictionary } from 'handsontable/i18n/registry';
// TODO(handsontable-codemod 18.0.0/type-settings-cellsettings): CellSettings: Use `CellMeta & { row: number; col: number }`, which is what it was, or...
// TODO(handsontable-codemod 18.0.0/type-settings-omit): Omit: Use the built-in TypeScript `Omit`.
import type { CellSettings, Omit } from 'handsontable/settings';

export const plugins: Plugins | null = null;
export const cellTypes: CellTypes | null = null;
export const editors: Editors | null = null;
export const renderers: Renderers | null = null;
export const validators: Validators | null = null;
export const validator: BaseValidator | null = null;
export const shortcut: Shortcut | null = null;
export const dictionary: LanguageDictionary | RegistryDictionary | null = null;
export const cell: CellSettings | null = null;
export type WithoutRow = Omit<{ row: number; col: number }, 'row'>;
