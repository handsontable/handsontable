// Ambient declarations for modules that ship without TypeScript declarations.
//
// Prefer `@ts-expect-error` at the import site in the example itself. A shim here makes
// the example pass this check while it still fails in the docs example runner and in a
// reader's own strict project. Add an entry only when the suppression cannot live at a
// single import. See README.md, "Adding a new third-party library to an example".
//
// Keep this file free of imports and exports — a top-level `import`/`export` would turn
// it into a module, and `declare module` blocks would become augmentations instead of
// ambient declarations.
//
// Currently empty.
