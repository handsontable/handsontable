# Code examples

This folder contains all code examples, that Handsontable uses for a myriad of reasons, such as documentation, blog, etc. Each code example is a separate project that uses Handsontable to present certain features.

Code examples are structured by Handsontable version. Inside the version directory, examples are grouped by category, which can be anything. The most important category is "docs", which is used in the Handsontable documentation website.

To see a deployed code example you can visit its URL. See [Live on production](#live-on-production) section to learn about the URL structure.

To run arbitrary code example locally on your machine see [How to run the arbitrary code example](#how-to-run-the-arbitrary-code-example) section.

### Contents

- [Folder structure](#folder-structure)
- [Live on production](#live-on-production)
- [Creating new examples](#creating-new-examples)
- [Deployment](#deployment-of-the-new-code-examples)
- [Editing existing examples](#editing-existing-examples)
- [Copying an example to a separate repo](#copying-an-example-to-a-separate-repo)
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

Dependency sharing is defined by a shared lockfile (`/examples/<version_number>/<category>/<framework>/package-lock.json`) for all examples of each framework. The `examples:install` script bumps the dependency versions in shared lockfiles. A single example's lockfile (e.g. `/examples/<version_number>/<category>/<framework>/<example_path>/package-lock.json`) can still be created when you run `npm install` inside the example's folder, but is ignored in `/examples/.gitignore`.

### Live on production

All code examples are available online. The base URL for the code examples is `https://examples.handsontable.com/examples/` with the path to the built project after the slash.

URL to the specific project follow the undermentioned convention:

`<version_number>/<category>/<framework>/<example_path>`

An example URL to the live example: https://examples.handsontable.com/examples/11.1.0/docs/js/basic-example/

For more details see the [Folder structure](#folder-structure) section.

**Note:** The https://examples.handsontable.com/examples/ URL is not CORS-enabled. If that poses a problem, you can use the GitHub-based, CORS-enabled direct equivalent: https://handsontable.github.io/handsontable.

### Creating new examples

Read the [Templates Guideline](./templates/README.md) for the detailed information about new code examples creation.

### Deployment of the new code examples

After new code examples are merged into master branch and the new version of the Handsontable has been released to the NPM, you can safely deploy new examples.

In Github Actions do a manual dispatch of the ["Code Examples Deployment" workflow](https://github.com/handsontable/handsontable/actions/workflows/code-examples.yml) with the `<version_number>` input set as the Handsontable version you want to deploy. A new folder will be created: `/examples/<version_number>`, containing the new code examples with Handsontable version fixed to the `<version_number>`.

The new code snippets will be deployed to the Github Pages and will be available under URL mentioned in the ["Live on production" section](#live-on-production) section.

### Editing existing examples

Sometimes you want to edit existing code examples that is live in the `/examples/<version_number>` directory.

1. Edit code examples within the `/examples/<version_number>` directory.
2. Commit and push the code examples to the repo.
3. After merging your feature branch to the `develop` branch, the code examples will be deployed to the Github Pages and will be available under their already-existing URL.

You can also deploy examples without committing anything by using the ["Code Examples Deployment" workflow](https://github.com/handsontable/handsontable/actions/workflows/code-examples.yml). See the [Deployment of the new code examples](#deployment-of-the-new-code-examples) section for more details.
<br>Note that dispatching the workflow will overwrite the already-existing examples from the `gh-pages` branch (even when they're based on a branch different from `develop`).

### Copying an example to a separate repo

It is possible to copy an example into a new Git repo. Doing it is as simple as making a copy of the example folder. 

When making a copy, keep in might that the `node_modules` folder in our monorepo workspace might contain symbolic links. For a clean slate, it is a good idea to remove this folder altogether it and regenerate it in the copied folder. 

The below commands present how to copy an example with the above advice in mind:

```bash
# make a local clone of the repo, if you haven't already
git clone https://github.com/handsontable/handsontable.git

# verify that you are in the folder of the example by checking that the README.md file is the one that you are reading right now
cat README.md

# if it exists, delete the "node_modules" folder of the example, because our NPM workspace sets it up as a symlink in the monorepo (which will not be useful in your fork)
rm -rf node_modules

# copy the example into a new folder called "forked-example" that is a sibling folder of the monorepo
cp -r . ../../../../../../forked-example

# go to your fork
cd ../../../../../../forked-example

# if you want, initiate a new Git repo there
git init
git add .
git commit -m "initial commit in my fork of the Handsontable example"

# install dependencies and start the example
npm install
npm run start
```

### Development

To see code examples in action run these commands from the _root_ of the repository (_not_ the `examples` subdirectory):

0. **`npm run examples:version <version_number>`** - will create a new directory at `examples/<version_number>` and fill it with code examples based on the `examples/next` directory, with the `handsontable` and `@handsontable/<framework_name>` dependencies updated with the provided `<version_number>`.<br> **(This step is optional - done only when creating a new set of examples based on a new version of Handsontable)** <br><sup> &nbsp;</sup>
1. **`npm run examples:install <version_number>`** - will install the dependencies of all the examples matching the `<version_number>`, utilizing the `examples`' internal workspace logic.
    - If the `next` version of the examples is being installed, after the dependencies are all in place the script will symlink the local dependencies needed for the examples to work as expected:
        - All the `next` examples require a local build of Handsontable, linked as `handsontable`.
        - The framework-based examples required their respective wrapper builds, linked as `@handsontable/<framework_name>`.
        - All the required symlinks are created in the `examples/next/docs/<framework_name>/node_modules` directory
            - Additionally, the Angular examples require creating additional symlinks in the `node_modules` directories inside the actual examples (pointing to `node_modules` a level higher).
    - When installing a semver-based version of the examples, the only thing being symlinked are `handsontable` and `@handsontable/angular` in the `node_modules` directory of the angular-based examples (pointing to `node_modules` a level higher).
2. **`npm run examples:build <version_number>`** - will build each code example in the `/examples/<version_number>` directory then copy each example's production output to the `/examples/tmp/<version_number>`. The path to the code example in the `/examples/tmp` follows the [Folder structure](#folder-structure) convention.
3. **`npm run examples:start`** - it will start the `http-server` right in the `/examples/tmp` on PORT `8080`. So the URL to the specific code example would be `http://localhost:8080/8.1.0/docs/angular/custom-context-menu/`. The URL follows the same convention as mentioned in the [Live on production](#live-on-production) section.

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
