# Code examples

This folder contains all code examples, that Handsontable uses for myriad reasons, such as documentation, blog, etc. Each code example is a separate project that uses Handsontable to present certain features.

Code examples are structured by Handsontable version. Inside the version directory, examples are grouped by category, which can be anything. The most important category is "docs", which is used in the Handsontable documentation website.

To see a deployed code example you can visit its URL. See [Live on production](#live-on-production) section to learn about the URL structure.

To play around with the actual code for a specific code example you can open it on CodeSandbox. See [Preview on CodeSandbox](#preview-on-codesandbox) section to learn more.

To run arbitrary code example locally on your machine see [How to run the arbitrary code example](#how-to-run-the-arbitrary-code-example) section.

### Contents

- [Folder structure](#folder-structure)
- [Live on production](#live-on-production)
- [Preview on CodeSandbox](#preview-on-codesandbox)
- [Creating new examples](#creating-new-examples)
- [Deployment](#deployment-of-the-new-code-examples)
- [Editing existing examples](#editing-existing-examples)
- [Development](#development)
  - [How to run the arbitrary code example](#how-to-run-the-arbitrary-code-example)
- [Testing](#testing)
  - [How to tun tests for arbitrary code example](#how-to-tun-tests-for-arbitrary-code-example)
  - [How to run tests for the versioned code examples locally](#how-to-run-tests-for-the-versioned-code-examples-locally)

### Folder structure

Within the `/examples` directory, there are all the code examples created for specific Handsontable version and the `templates` folder, which contains base projects for creating new code examples. A path to the example follow the undermentioned convention:

`/examples/<version_number>/<category>/<framework>/<example_path>`

- `<version_number>` - the destributed version of the Handsontable and Handsontable's wrapper or `next` - the value provided to the NPM scripts as the last argument.
- `<category>` - category of the code examples. The main category is `docs` which means: code examples from the documentation.
- `<framework>` - any supported framework's name (react, angular, vue, js).
- `<example_path>` - path to the specific code example. A folder name of the code example will identify that code example - it will be used as a URL further. The folder name of the code example should be the same across all the frameworks.

An example path to the code example: `examples/8.1.0/docs/angular/custom-id`

It's worth noting, that the `examples` directory is defined as a `npm workspace`, as well as each of the `<framework>` directories within it. This allows installing shared dependencies for all the framework-specific examples.

### Live on production

All code examples are available online. The base URL for the code examples is https://examples.handsontable.com/handsontable/ and after the slash comes the path to the built project. 

URL to the specific project follow the undermentioned convention:

`<version_number>/<category>/<framework>/<example_path>`

An example URL to the live example: https://examples.handsontable.com/handsontable/8.1.0/docs/js/settings

For more details see the [Folder structure](#folder-structure) section.

### Preview on CodeSandbox

To preview the arbitary code example on CodeSandbox you must get the link to the project folder in the Gihub repo. You will find all code examples in our repo https://github.com/handsontable/handsontable/tree/develop/examples.

For example: if the URL to the project is: https://github.com/handsontable/handsontable/tree/develop/examples/next/docs/js/basic-example  you can preview that project on CodeSandbox by adding the "box" word right after the "github" and before the ".com". The URL to the sandboxed project would be https://githubbox.com/handsontable/handsontable/tree/develop/examples/next/docs/js/basic-example .

### Creating new examples

Read the [Templates Guideline](./templates/README.md) for the detailed information about new code examples creation.

### Deployment of the new code examples

After new code examples are merged into master branch and the new version of the Handsontable has been released to the NPM, you can safely deploy new examples.

In Github Actions run a manual workflow with the `<version_number>` input for the Handsontable version. The new folder will be created: `/examples/<version_number>`. Within that folder, new code examples will be created with Handsontable version fixed to the `<version_number>`.

The new code snippets will be deployed to the Github Pages and will be available under URL mentioned in the "Live on production" section in the [Code Examples](../README.md) README.

### Editing existing examples

Sometimes you want to edit existing code examples that is live in the `/examples/<version_number>` directory.

1. Edit code examples within the `/examples/<version_number>` directory.
2. Commit and push the code examples to the repo.
3. In Github Actions run a manual workflow with the `<version_number>` input of the Handsontable and Handsontable's wrapper version.
4. The code examples will be deployed to the Github Pages and will be available under the same URL as they already were.

### Development

To see code examples in action run these commands:

1. `npm run examples:install <version_number>` - will install the dependencies of all the examples matching the `<version_number>`, utilizing the `examples`' internal workspace logic.
2. `npm run examples:build <version_number>` - will build each code example in the `/examples/<version_number>` directory then copy each example's production output to the `/examples/tmp/<version_number>`. The path to the code example in the `/examples/tmp` follows the [Folder structure](#folder-structure) convention.
3. `npm run examples:start` - it will start the `http-server` right in the `/examples/tmp` on PORT `8080`. So the URL to the specific code example would be `http://localhost:8080/8.1.0/docs/angular/custom-context-menu/`. The URL follows the same convention as mentioned in the [Live on production](#live-on-production) section.

**Important:** As the `next` directory of the examples uses the local builds of `handsontable` and the wrappers, for the `next` build process to work, all the root-level packages need to be built (for example, bu running `npm run all build`) before running the examples build script.

#### How to run the arbitrary code example

To launch only one code example, go to the project directory, run `npm install` and `npm run start`. This will instal all the project dependencies and start a development server. After this command is called visit http://localhost:8080.

### Testing

Each code example has its own test specs, which lives in the `spec` directory.

> Templates have one **failing test**, which has been added to force developers to write passing tests for the next code examples.

#### How to tun tests for arbitrary code example

Each code example has its own test suites which you can run using a development server:
1. Run the `npm run start` command.
2. After the app is launched on a server, run the `npm run test` command which will launch tests specified to this code example.

#### How to run tests for the versioned code examples locally

1. Code examples **must** exist in the `examples/<version_number>` directory and be built using the command `npm run examples:build <version_number>`.
3. `npm run examples:test <version_number>`. This command will run `npm run test` for each code example (to know what the `npm run test` command does check out the section above).
