## Templates Guidline

These templates are a base for the new code examples.

### Creating a new example

All new code examples should be added to the `/examples/next` directory. Based on them you can create versioned code examples.

1. Add new example using the template within the `/next` directory with paths followed by the convention `/<category>/<framework>/<example_path>`.
2. Commit and push the examples to the repo.
3. In Github Actions run a manual workflow with the `<version_number>` input for the Handsontable and Handsontable's wrapper version. The new folder will be created: `/examples/<version_number>`. Within that folder, new code snippets will be created with Handsontable and Handsontable's wrapper version fixed to the `<version_number>`. Note that the Handsontable **version must be available on the NPM** first.
4. The new code snippets will be deployed to the Github Pages and will be available under URL mentioned in the "Live on production" section in the [Code Examples](../README.md).

### Requirements for a new example

In order to create new code examples with these templates, each new example must have certain features in the `package.json` file and updated `README.md` with an example's detailed information.

#### Common features (the same for every new example)

- `"version": "0.0.0"` (will be overwritten on new version created),
- `"homepage": "https://handsontable.com/"`,
- `"private": true`,
- `"repository"` with properties:
  - `"type": "git"`,
  - `"url": "https://github.com/handsontable/handsontable.git"`
- `"bugs"` with the property:
  - `"url": "https://github.com/handsontable/handsontable/issues"`
- `"author": "Handsoncode <hello@handsontable.com>"`,
- `"license": "MIT"`,
- `"dependencies"` with properties:
  - `"handsontable": "latest"`
  - `"@handsontable/{{ WRAPPER NAME }}: "latest"` (only for frameworks)

#### Don't touch

Each example have its own scripts ***you should never modify or remove***: `npm run start`, `npm run build`, `npm run jasmine`, `npm run serve` (not every example have this script), `npm run test` and `npm run test:ci`.
