/**
 * A dropdown cell displays a value exactly like an autocomplete cell, so it shares that getter
 * outright rather than delegating to it.
 *
 * A hand-written delegate used to sit here, and it forwarded only the value - dropping the cell
 * meta, which carries `sourceLabel`, so a dropdown displayed an object `value` unlabeled. A
 * re-export has no argument list to keep in sync, the same reason the setter is shared.
 */
export { valueGetter } from '../../autocompleteType/accessors';
