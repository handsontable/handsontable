import Handsontable from 'handsontable';
import HandsontableBase from 'handsontable/base';
import type { HotInstance } from 'handsontable';
import { CellCoords, CellRange } from 'handsontable/base';
import { settingsSchema, validateSettings } from 'handsontable/settingsSchema';
import type { SettingsProblemCode, SettingsValidationResult } from 'handsontable/settingsSchema';

/**
 * Consumer fixture for `scripts/verify-esm-consumer-types.mjs`. It is compiled as an ES module
 * under `node16`, `nodenext` and `bundler`, resolved through the real `exports` map of the composed
 * package. It is not part of any tsconfig of this package.
 *
 * The default import of an entry point must be the `Handsontable` factory, not the CommonJS
 * module namespace (DEV-3430), and not `any`.
 */

const root = document.createElement('div');

export const fromIndex = new Handsontable(root, {});
export const fromBase = new HandsontableBase(root, {});
export const calledFromIndex = Handsontable(root, {});
export const calledFromBase = HandsontableBase(root, {});

// Namespace members must resolve through the default import.
export let indexCore: Handsontable.Core = fromIndex;
export let baseCore: HandsontableBase.Core = fromBase;
export let indexSettings: Handsontable.GridSettings = {};
export let baseSettings: HandsontableBase.GridSettings = {};

// The default import is the same declaration the named types of the `.d.ts` graph refer to.
export const indexInstance: HotInstance = fromIndex;
export const baseInstance: HotInstance = fromBase;

export const crossedCore: Handsontable.Core = fromBase;
export const coordsClass: typeof CellCoords = HandsontableBase.CellCoords;
export const rangeClass: typeof CellRange = Handsontable.CellRange;

// The type exports a `node16` default import used to reach as members of the module namespace.
export type IndexEvents = Handsontable.Events;
export type BaseEvents = HandsontableBase.Events;
export type IndexRange = Handsontable.RangeType;
export type BaseThemeConfig = HandsontableBase.ThemeConfig;
export const aliasedInstance: Handsontable.HotInstance = fromIndex;
export const aliasedCoords: Handsontable.CellCoords = new HandsontableBase.CellCoords(0, 0);

export const indexVersion: string | undefined = Handsontable.version;
export const baseVersion: string | undefined = HandsontableBase.version;
export const indexPlugin = Handsontable.plugins.AutoColumnSize;

// The `settingsSchema` entry point resolves with its named exports typed.
export const validation: SettingsValidationResult = validateSettings({ colHeaders: true }, { level: 'grid' });
export const problemCode: SettingsProblemCode | undefined = validation.problems[0]?.code;
export const schemaVersion: string | undefined = settingsSchema.$schema;

// Guards. Each line must fail to compile. They fail the check when the default import collapses to `any`.
// @ts-expect-error `version` is not a number, so `Handsontable` must not be `any`.
export const indexVersionIsTyped: number = Handsontable.version;
// @ts-expect-error `version` is not a number, so `Handsontable` must not be `any`.
export const baseVersionIsTyped: number = HandsontableBase.version;
// @ts-expect-error the namespace has no such member, so `Handsontable` must not be `any`.
export type IndexNoSuchMember = Handsontable.NoSuchMember;
// @ts-expect-error the namespace has no such member, so `HandsontableBase` must not be `any`.
export type BaseNoSuchMember = HandsontableBase.NoSuchMember;
// @ts-expect-error `valid` is a boolean, so `validateSettings` must not return `any`.
export const validIsTyped: string = validation.valid;
