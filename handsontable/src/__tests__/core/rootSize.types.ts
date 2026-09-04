import type { GridSettings } from 'handsontable';

/**
 * The grid `width` / `height` options accept a number of pixels, the `'auto'` keyword, any other
 * string (a CSS length or expression, validated at runtime), or a function returning one of those.
 * The `'auto'` literal exists for editor completion; `(string & {})` keeps every other string
 * assignable.
 */
// `Exclude`, not `NonNullable`: the latter is `T & {}`, and distributing that intersection merges
// the `'auto'` literal into the `(string & {})` member, which makes the pin below read `never`.
type HeightOption = Exclude<GridSettings['height'], undefined>;
type WidthOption = Exclude<GridSettings['width'], undefined>;

const documentedForms: GridSettings = {
  height: 500,
};
const heightString: GridSettings = { height: '250' };
const heightPixelString: GridSettings = { height: '250px' };
const heightPercent: GridSettings = { height: '50%' };
const heightCalc: GridSettings = { height: 'calc(100% - 40px)' };
const heightAuto: GridSettings = { height: 'auto' };
const heightFunction: GridSettings = { height: () => 'auto' };
const widthString: GridSettings = { width: '250' };
const widthPercent: GridSettings = { width: '50%' };
const widthCalc: GridSettings = { width: 'calc(100% - 40px)' };
const widthAuto: GridSettings = { width: 'auto' };
const widthFunction: GridSettings = { width: () => 500 };

// @ts-expect-error a boolean is not a size.
const heightBoolean: GridSettings = { height: true };
// @ts-expect-error an array is not a size.
const widthArray: GridSettings = { width: [200] };

/**
 * Pins the `'auto'` literal by exhaustiveness. `(string & {})` accepts every string, so assigning
 * `'auto'` above proves nothing on its own; the `Record` fails when the literal is dropped (TS2741)
 * or misspelled (TS2561), and the plain assignment fails when the union collapses to `string`.
 */
type KnownKeyword<T> = T extends string ? (string extends T ? never : T) : never;

const pinnedHeight: KnownKeyword<HeightOption> = 'auto';
const pinnedWidth: KnownKeyword<WidthOption> = 'auto';

const heightKeywords: Record<KnownKeyword<HeightOption>, true> = {
  auto: true,
};
const widthKeywords: Record<KnownKeyword<WidthOption>, true> = {
  auto: true,
};
