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
 * The point of the exported type. Annotating the parameter narrows it to the surfaces the grid
 * emits, so an editor completes them and a typo in a comparison is a type error.
 */
const optIn: GridSettings = {
  sanitizer: (content: string, source: SanitizerContext) =>
    (source === 'CopyPaste.paste' ? content.trim() : content),
};

/**
 * Every declaration that compiled before this change must still compile. The option is public and
 * shipped in 17.0.0, so narrowing it in any direction is a build break on upgrade.
 */
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sanitizer: (content: string, source: string, extra: string) => content,
};

/**
 * Reading the option back out and calling it. This is the axis that a named second parameter
 * regresses: declaring one raises the minimum call arity from one to two, and the single-argument
 * call below stops compiling with TS2555. Nothing else in this file catches that, because
 * assignability and callability are separate checks.
 */
const calledWithOneArgument = hot.getSettings().sanitizer?.('<b>x</b>');
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
  sanitizer: (content: string, source: SanitizerContext) => content,
};

/**
 * A context no grid surface emits stays assignable, so a sanitizer shared with another library, or
 * one branching on a surface added in a later release, keeps compiling. `'innerHTML'` is the
 * concrete case: `Handsontable.dom.fastInnerHTML()` passes it when a caller supplies no context.
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
 * then fails both ways: a literal added to the union without a case here is TS2741, and a literal
 * dropped from or misspelled in the union is TS2353 on the orphaned key.
 *
 * Update this map when the grid starts emitting a new context, and update the `sanitizer` JSDoc in
 * `metaSchema.ts` plus the surface table in the security guide in the same change.
 */
type KnownContext<T> = T extends string ? (string extends T ? never : T) : never;

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
