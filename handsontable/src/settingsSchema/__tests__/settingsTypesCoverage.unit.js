import { settingsSchema } from 'handsontable/settingsSchema';
import { internals } from 'handsontable/settingsSchema/schema.generated';

describe('settings types coverage', () => {
  it('should declare every documented option in the settings types', () => {
    // An option the types leave out falls into `GridSettings`' `[key: string]: any`: no completion,
    // no type check, and a schema entry built from the coarse JSDoc `@type`. Declare it in
    // `src/core/settings.ts` (or `src/settings.ts` for a cell-meta key).
    expect(internals.fromJsDoc).toEqual([]);
  });

  it('should keep every option node small', () => {
    // A type that names a class (`ThemeBuilder`) or a wide config (`ThemeParams`) expands into every
    // field and token it holds: `theme` alone grew the published schema from 65 KB to over 130 KB. List a
    // class in the generator's `RUNTIME_OBJECT_TYPES`, or type the option as `object`. The column level
    // builds its nodes on its own, so they are scanned as well.
    const oversized = [
      ...Object.entries(settingsSchema.properties),
      ...Object.entries(settingsSchema.$defs.columnSettings.properties),
    ]
      .filter(([, node]) => JSON.stringify(node).length > 3000)
      .map(([name]) => name);

    expect(oversized).toEqual([]);
  });
});
