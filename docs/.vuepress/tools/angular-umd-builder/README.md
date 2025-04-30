# Angular UMD Builder

This tool is responsible for building UMD (Universal Module Definition) bundles of Angular and Handsontable's Angular wrapper for use in the documentation. It creates pre-built, minified UMD bundles that can be loaded directly in the browser.

## Why This Tool Exists

The documentation site needs to demonstrate Angular integration with Handsontable in a browser environment. However, Angular is typically used with a build system and doesn't provide UMD bundles out of the box. This tool solves this by:

1. Bundling Angular core modules into UMD format.
2. Creating a UMD bundle of the Handsontable Angular wrapper.
3. Properly setting up all necessary dependencies and externals.
4. Minifying the output for production use.

## Why Separate Dependencies

This tool maintains its own `package.json` and dependencies becuase it has to use a modern Webpack config in order to correctly process the Angular dependencies - Vuepress requires `webpack@4` to work, while this builder requires `webpack@5`.

## Usage

The tool is typically run as part of the documentation build process. It can be executed manually using:

```bash
npm run umd-builder:full-build
```

This command will:
1. Install the required dependencies.
2. Build the UMD bundles.
3. Clean up the temporary dependencies.

It can also be run straight from the `/docs` directory by calling `npm run docs:build:angular-umd`.

## Output

The built UMD bundles are placed in `docs/.vuepress/public/scripts/prebuilt-umd/` and include:

- Angular core modules (core, common, forms, etc.).
- The Handsontable Angular wrapper.
- All necessary dependencies properly configured.

## Cleanup

After building, the tool automatically cleans up its dependencies to keep the project clean and prevent any potential conflicts with the docs' dependencies.
