import type Handsontable from 'handsontable';
import type { GridSettings, SanitizerContext, RemoveIndexSignature } from 'handsontable';

/**
 * `SanitizerContext` is published as a type users opt into, and the `sanitizer` option's own
 * signature is left exactly as it shipped. These assertions pin that decision from both sides: the
 * option still accepts and still calls the way it always did, and the exported type delivers the
 * completion it exists for.
 */

declare const hot: Handsontable;
declare function takesString(value: string): void;

/**
 * The point of the exported type. Annotating the parameter names the surfaces the grid emits, so an
 * editor completes them as you write the branch. It cannot reject a misspelled comparison: the
 * `(string & {})` member accepts every string, which is the deliberate trade documented below.
 */
const optIn: GridSettings = {
  sanitizer: (content: string, source: SanitizerContext) =>
    (source === 'CopyPaste.paste' ? content.trim() : content),
};

/**
 * Every declaration that compiled before this change must still compile. The baseline is **18.0.0**,
 * which is where `...args: any[]` arrived with the TypeScript conversion. 17.0.0 shipped
 * `(content: string, source: 'innerHTML' | 'CopyPaste.paste') => string` - two required, narrowly
 * typed parameters - so neither break this file guards against existed against that release.
 */
// These two cannot be tripped by any change to the second parameter, which `...args: any[]` leaves
// unchecked. They guard the first parameter and the return type instead - live concerns while
// DEV-2617 is considering `TrustedHTML` on this option.
const oneParameter: GridSettings = {
  sanitizer: content => content,
};

const inferredContext: GridSettings = {
  sanitizer: (content, source) => (source === 'header' ? content.trim() : content),
};

/**
 * The second parameter is inferred as `any`, so a body that uses it as a definite string keeps
 * working. Declaring `context: SanitizerContext` on the option would keep this compiling, but
 * declaring it `context?: SanitizerContext` would not - the parameter would carry `| undefined`.
 */
const contextUsedAsString: GridSettings = {
  sanitizer: (content, source) => {
    takesString(source);

    return content;
  },
};

const widelyTypedContext: GridSettings = {
  sanitizer: (content: string, source: string) => content,
};

const narrowlyTypedContext: GridSettings = {
  sanitizer: (content: string, source: 'header' | 'CopyPaste.paste') => content,
};

/**
 * Only two arguments are ever passed, so a third parameter is dead - but `...args: any[]` is what
 * keeps it compiling. TypeScript accepts a callback with fewer parameters than declared and rejects
 * one with more.
 */
const thirdParameter: GridSettings = {
  sanitizer: (content: string, source: string, extra: string) => content,
};

/**
 * Reading the option back out and calling it. This is the axis that a named second parameter
 * regresses: declaring one raises the minimum call arity from one to two, and the single-argument
 * call below stops compiling with TS2555. Nothing else in this file catches that, because
 * assignability and callability are separate checks.
 */
const calledWithOneArgument = hot.getSettings().sanitizer?.('<b>x</b>');
// Not redundant with the line above: this one fails with TS2554 if the rest parameter is ever
// dropped, which the single-argument call cannot detect.
const calledWithTwoArguments = hot.getSettings().sanitizer?.('<b>x</b>', 'header');

/**
 * The wrappers do not consume `GridSettings` directly. React builds `HotTableProps` from
 * `Omit<RemoveIndexSignature<GridSettings>, ...>` and Angular builds its `GridSettings` from
 * `Omit<Handsontable.GridSettings, ...>`, so assert the option survives that chain too.
 */
type WrapperProps = Omit<RemoveIndexSignature<GridSettings>, 'renderer' | 'editor'> & {
  [key: string]: any;
};

const throughWrapperMappedTypes: WrapperProps = {
  // Annotated narrowly on purpose. `SanitizerContext` accepts every string, so annotating with it
  // here would pass no matter how the option is declared and guard nothing. Only a narrower type
  // than the option declares detects a variance change through the chain.
  sanitizer: (content: string, source: 'header' | 'CopyPaste.paste') => content,
};

/**
 * A context no grid surface emits stays assignable, so a sanitizer shared with another library, or
 * one branching on a surface added in a later release, keeps compiling. `'innerHTML'` is the
 * concrete case: `Handsontable.dom.fastInnerHTML()` passes it when a caller supplies no context.
 *
 * These two are what pin the `(string & {})` member: drop it and both fail with TS2322.
 */
const unknownContext: SanitizerContext = 'innerHTML';
const arbitraryContext: SanitizerContext = 'some.surface.added.later';

/**
 * The two assignments above cannot pin the union's contents: `(string & {})` accepts every string,
 * so they would pass against an empty union or a misspelled literal just as well. Completion on the
 * eight literals is the whole point of the type, so pin them by exhaustiveness instead.
 *
 * `KnownContext` drops the `(string & {})` member by discarding the constituent that every string is
 * assignable to, leaving the literals. (`Exclude<SanitizerContext, string & {}>` cannot do this - it
 * erases the whole union, because each literal is itself assignable to `string & {}`.) The `Record`
 * then fails three ways: a literal added to the union without a case here is TS2741, one dropped
 * from the union is TS2353, and one misspelled in the union is TS2561 on the orphaned key.
 *
 * Update this map when the grid starts emitting a new context, and update the `sanitizer` JSDoc in
 * `metaSchema.ts` plus the surface table in the security guide in the same change.
 */
type KnownContext<T> = T extends string ? (string extends T ? never : T) : never;

// The `Record` below cannot catch the union collapsing to plain `string`: `KnownContext` would
// yield `never`, `Record<never, true>` is `{}`, and the eight-key object still assigns. This line
// fails in that case, because no literal is assignable to `never`.
const pinnedLiteral: KnownContext<SanitizerContext> = 'header';

const everyKnownContext: Record<KnownContext<SanitizerContext>, true> = {
  header: true,
  password: true,
  contextMenu: true,
  selectEditor: true,
  dialog: true,
  notification: true,
  'CopyPaste.paste': true,
  'CopyPaste.paste.sourceData': true,
};

const namespaced: Handsontable.SanitizerContext = 'password';
