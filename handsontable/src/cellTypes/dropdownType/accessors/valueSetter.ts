/**
 * A dropdown cell stores and resolves a value exactly like an autocomplete cell, so it shares that
 * setter outright rather than delegating to it.
 *
 * A hand-written delegate used to sit here, and it dropped the `cellMeta` argument - which is what
 * carries `source`, so the resolution never ran for the one cell type where the damage is visible
 * (a dropdown is `strict` by default, and an unresolved label fails its validator). A re-export has
 * no argument list to keep in sync, so that mistake cannot be made again (DEV-57).
 */
export { valueSetter } from '../../autocompleteType/accessors';
