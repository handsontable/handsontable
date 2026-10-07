import type Handsontable from 'handsontable';
import type { GridSettings, TextExtractorContext, RemoveIndexSignature } from 'handsontable';

/**
 * `TextExtractorContext` is published as a type users opt into, mirroring `SanitizerContext`. These
 * assertions pin both halves of the option: the `true | function` union it accepts, and the
 * completion the exported type exists to deliver.
 */

declare const hot: Handsontable;
declare function takesString(value: string): void;

/**
 * The shorthand. Selecting the built-in extraction must stay a single word - if the option ever
 * narrowed to a function this fails with TS2322, which is the whole ergonomic promise.
 */
const builtIn: GridSettings = {
  textExtractor: true,
};

/**
 * `false` and a plain `boolean` have to be assignable. The option is typed `boolean` rather than
 * `true` so a caller can pass a flag straight through; narrowing it to `true` breaks the last two
 * of these with TS2322, which is the whole reason the wider type is there.
 */
declare const flag: boolean;

const explicitlyOff: GridSettings = {
  textExtractor: false,
};

const fromFlag: GridSettings = {
  textExtractor: flag,
};

/**
 * The point of the exported type. Annotating the parameter names the surfaces the grid emits, so an
 * editor completes them as you write the branch. It cannot reject a misspelled comparison: the
 * `(string & {})` member accepts every string, which is the deliberate trade it inherits.
 */
const optIn: GridSettings = {
  textExtractor: (content: string, source: TextExtractorContext) =>
    (source === 'ExportFile.rowHeader' ? content.trim() : content),
};

const oneParameter: GridSettings = {
  textExtractor: content => content,
};

const inferredContext: GridSettings = {
  textExtractor: (content, source) =>
    (source === 'ExportFile.columnHeader' ? content.trim() : content),
};

/**
 * The second parameter is inferred as `any`, so a body that uses it as a definite string keeps
 * working. This is why the option declares `...args: any[]` rather than naming the parameter -
 * declaring it optional would carry `| undefined` and break this.
 */
const contextUsedAsString: GridSettings = {
  textExtractor: (content, source) => {
    takesString(source);

    return content;
  },
};

const widelyTypedContext: GridSettings = {
  textExtractor: (content: string, source: string) => content,
};

const narrowlyTypedContext: GridSettings = {
  textExtractor: (content: string, source: 'ExportFile.columnHeader') => content,
};

/**
 * Only two arguments are ever passed, so a third parameter is dead - but `...args: any[]` is what
 * keeps it compiling. TypeScript accepts a callback with fewer parameters than declared and rejects
 * one with more.
 */
const thirdParameter: GridSettings = {
  textExtractor: (content: string, source: string, extra: string) => content,
};

/**
 * Reading the option back out. Unlike `sanitizer`, this one is a union, so a caller reusing it must
 * narrow to the function form first. Pinning that here keeps the requirement deliberate rather than
 * something a later change quietly alters.
 */
const configured = hot.getSettings().textExtractor;

if (typeof configured === 'function') {
  const calledWithOneArgument = configured('<b>x</b>');
  // Not redundant with the line above: this one fails with TS2554 if the rest parameter is ever
  // dropped, which the single-argument call cannot detect.
  const calledWithTwoArguments = configured('<b>x</b>', 'ExportFile.columnHeader');
}

/**
 * The wrappers do not consume `GridSettings` directly. React builds `HotTableProps` from
 * `Omit<RemoveIndexSignature<GridSettings>, ...>` and Angular builds its `GridSettings` from
 * `Omit<Handsontable.GridSettings, ...>`, so assert the option survives that chain too.
 */
type WrapperProps = Omit<RemoveIndexSignature<GridSettings>, 'renderer' | 'editor'> & {
  [key: string]: any;
};

const throughWrapperMappedTypes: WrapperProps = {
  // Annotated narrowly on purpose. `TextExtractorContext` accepts every string, so annotating with
  // it here would pass no matter how the option is declared and guard nothing.
  textExtractor: (content: string, source: 'ExportFile.columnHeader') => content,
};

const shorthandThroughWrapperMappedTypes: WrapperProps = {
  textExtractor: true,
};

/**
 * A context no grid surface emits stays assignable, so an extractor shared with another library, or
 * one branching on a surface a plugin adds later, keeps compiling. This is what makes the option
 * extensible without a change here.
 *
 * These two are what pin the `(string & {})` member: drop it and both fail with TS2322.
 */
const unknownContext: TextExtractorContext = 'Print.columnHeader';
const arbitraryContext: TextExtractorContext = 'some.surface.added.later';

/**
 * The two assignments above cannot pin the union's contents: `(string & {})` accepts every string,
 * so they would pass against an empty union or a misspelled literal just as well. Completion on the
 * shipped literals is the whole point of the type, so pin them by exhaustiveness instead.
 *
 * The `Record` fails three ways: a literal added to the union without a case here is TS2741, one
 * dropped from the union is TS2353, and one misspelled in the union is TS2561 on the orphaned key.
 *
 * Update this map when a surface starts emitting a new context, and update the `textExtractor`
 * JSDoc in `metaSchema.ts` in the same change.
 */
type KnownContext<T> = T extends string ? (string extends T ? never : T) : never;

// The `Record` below cannot catch the union collapsing to plain `string`: `KnownContext` would
// yield `never`, `Record<never, true>` is `{}`, and the object still assigns. This line fails in
// that case, because no literal is assignable to `never`.
const pinnedLiteral: KnownContext<TextExtractorContext> = 'ExportFile.columnHeader';

const everyKnownContext: Record<KnownContext<TextExtractorContext>, true> = {
  'ExportFile.columnHeader': true,
  'ExportFile.rowHeader': true,
  'CopyPaste.columnHeader': true,
};

const namespaced: Handsontable.TextExtractorContext = 'ExportFile.rowHeader';
