# Figma theme generator

Generates Handsontable theme files (typed TypeScript variable modules and CSS) from Figma design tokens. Output is written directly into `handsontable/src/themes/static/`.

This is on-demand codegen — run it when the design tokens change, then commit the regenerated `src/themes/static/` files. It is not part of the default build.

## How to use

### Prerequisites

- Node.js 22 (the monorepo `.nvmrc`).
- A `tokens.json` exported from Figma.

### Steps

1. Export design tokens from Figma:

    - Find the "Design Tokens" plugin (Plugins & Widgets in Figma).
    - Open it and select Export → Export Design Token File.
    - In export options, deselect every "Include" type except Figma Variables.
    - Export to save the JSON file.

    See the "Design System in Figma" community file, "Create Custom Theme" tab, for the full instructions.

2. Place the export at `handsontable/scripts/themes/figma/tokens.json` (gitignored, never committed).

3. From the `handsontable/` package root, run:

    ```bash
    npm run generate:themes
    ```

    The whole `src/themes/static/` directory is wiped and regenerated.

4. Review and commit the regenerated files under `src/themes/static/`.

## Output

For every theme in `tokens.json`:

- `src/themes/static/css/theme/ht-theme-<name>.css` (with icons) and `ht-theme-<name>-no-icons.css` (without).
- `src/themes/static/variables/tokens/<name>.ts` and `colors/<name>.ts`.

Plus shared artifacts: `variables/sizing.ts`, `density.ts`, `icons/<name>.ts`, `helpers/iconsMap.ts`, and `css/icons/ht-icons-<name>.css`.

The variable modules are typed (they import from `src/themes/types.ts`) and consumed by the `handsontable` `registerTheme` API; the CSS files back the `theme` class-name option.

## Tests

```bash
node --test scripts/themes/figma/__tests__/
```

Covers the typed-module emitter and the iconsMap drift guard. See `.ai/` for architecture, conventions, and known concerns.

---

© 2012 - 2026 Handsoncode
