import type Handsontable from 'handsontable';
import type { GridSettings, SanitizerContext, SanitizerFn, RemoveIndexSignature } from 'handsontable';

/**
 * `sanitizer` is a public option, so widening its second argument from `any` to `SanitizerContext`
 * must not reject any declaration that compiled before. The cases below are the ones that can
 * regress; `settings.types.ts` covers the option in the context of a full settings object.
 */

const oneParameter: GridSettings = {
  sanitizer: content => content,
};

const untypedContext: GridSettings = {
  sanitizer: (content, source) => (source === 'CopyPaste.paste' ? content : content),
};

const widelyTypedContext: GridSettings = {
  sanitizer: (content: string, source: string) => content,
};

const namedContext: GridSettings = {
  sanitizer: (content: string, source: SanitizerContext) => content,
};

/**
 * The narrow annotation is the case the option's method syntax exists for. Declared as a
 * function-typed property instead, `strictFunctionTypes` checks the parameter contravariantly and
 * rejects this with TS2322.
 */
const narrowlyTypedContext: GridSettings = {
  sanitizer: (content: string, source: 'header' | 'CopyPaste.paste') => content,
};

/**
 * `...args: any[]` on the option is what keeps a declaration with a third parameter compiling.
 * Only two arguments are ever passed, so the parameter is dead, but removing the rest parameter
 * would break the build of anyone who declared one.
 */
const thirdParameter: GridSettings = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sanitizer: (content: string, source: string, extra: string) => content,
};

/**
 * A context the grid does not emit stays assignable, so a sanitizer shared with another library, or
 * one branching on a surface added in a later release, keeps compiling. `'innerHTML'` is the
 * concrete case: `Handsontable.dom.fastInnerHTML()` passes it when called without a context.
 */
const unknownContext: SanitizerContext = 'innerHTML';
const arbitraryContext: SanitizerContext = 'some.surface.added.later';

/**
 * The wrappers do not consume `GridSettings` directly. React builds `HotTableProps` from
 * `Omit<RemoveIndexSignature<GridSettings>, ...>` and Angular builds its `GridSettings` from
 * `Omit<Handsontable.GridSettings, ...>`. Homomorphic mapped types can re-emit a method as a
 * property, which would restore contravariance and bring the narrow-annotation break back for
 * wrapper users while this suite stayed green. Assert the chain here, where it is compiled.
 */
type WrapperProps = Omit<RemoveIndexSignature<GridSettings>, 'renderer' | 'editor'> & {
  [key: string]: any;
};

const throughWrapperMappedTypes: WrapperProps = {
  sanitizer: (content: string, source: 'header' | 'CopyPaste.paste') => content,
};

/**
 * `SanitizerFn` is derived from the option rather than declared a second time, so a sanitizer
 * written against the exported type is assignable to the option and vice versa.
 *
 * The indexed access carries the option's declaration-site bivariance, so the narrow annotation is
 * accepted here exactly as it is inline. A standalone alias written out by hand would not be: the
 * `strictFunctionTypes` exemption belongs to a member declared with method syntax, which is why
 * this type is extracted rather than restated.
 */
const standalone: SanitizerFn = (content, source) => content;
const narrowStandalone: SanitizerFn = (content: string, source: 'header') => content;
const fromStandalone: GridSettings = { sanitizer: standalone };

const namespaced: Handsontable.SanitizerContext = 'password';
const namespacedFn: Handsontable.SanitizerFn = (content, source) => content;
