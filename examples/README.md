# Code snippets

### Contents

- [Folder structure](#folder-structure)
- [Live on production](#live-on-production)
- [Preview on CodeSandbox](#preview-on-codesandbox)
- [Creating new snippets](#creating-new-snippets)
- [Editing existing snippets](#editing-existing-snippets)
- [Development](#development)
  - [How to run the arbitrary code snippet](#how-to-run-the-arbitrary-code-snippet)
- [Testing](#testing)
  - [How to tun tests for arbitrary code snippet](#how-to-tun-tests-for-arbitrary-code-snippet)
  - [How to run tests for the versioned code snippets locally](#how-to-run-tests-for-the-versioned-code-snippets-locally)

### Folder structure

Within the `/examples` directory, there are all the snippets created. A path to the example snippet follow the undermentioned convention:

`/examples/<version_number>/<category>/<framework>/<example_path>`

- `<version_number>` - the version of the Handsontable and Handsontable's wrapper - the value provided to the NPM scripts as the last argument.
- `<category>` - category of the code snippets. The main category is `docs` which means: code snippets from the documentation.
- `<framework>` - any supported framework's name (react, angular, vue, js).
- `<example_path>` - path to the specific code snippet. A folder name of the code snippet will identify that code snippet - it will be used as a URL further. The folder name of the code snippet should be the same across all the frameworks.

An example path to the code snippet: `examples/8.1.0/docs/angular/custom-id`

### Live on production

All code snippets are available online. The base URL for the code snippets is https://handsontable.github.io/code-snippets/ and after the slash comes the path to the built project. 

URL to the specific project follow the undermentioned convention:

`<version_number>/<category>/<framework>/<example_path>`

An example URL to the live snippet: https://handsontable.github.io/code-snippets/8.1.0/docs/js/settings

For more details see the [Folder structure](#folder-structure) section.

### Preview on CodeSandbox

Deployed code snippets are also available on CodeSandbox! 

To preview the arbitary code snippet on CodeSandbox you must get the link to the project folder in the Gihub repo. For example: if the URL to the project is https://github.com/handsontable/code-snippets/tree/master/examples/8.0.0/docs/js/settings you can preview that project on CodeSandbox adding the "box" word right after the "github" and before the ".com". The URL to the sandboxed project would be https://githubbox.com/handsontable/code-snippets/tree/master/examples/8.0.0/docs/js/settings.

### Creating new snippets

Read the [Templates Guideline](./templates/README.md) for the detailed information about new code examples creation.

### Editing existing snippets

Sometimes you want to edit existing code snippets that live in the `/examples/<version_number>` directory.

1. Edit code snippets within the `/examples/<version_number>` directory.
2. Commit and push the code snippets to the repo.
3. In Github Actions run a manual workflow with the `<version_number>` input of the Handsontable and Handsontable's wrapper version.
4. The code snippets will be deployed to the Github Pages and will be available under the same URL as they already were.

### Development

You can launch the `http-server` or any other server if you want to test and check code snippets live.

To see code snippets in action run these commands:

1. `npm run examples:build <version_number>` - will build all the code snippets in the `/examples/<version_number>` directory and copy each code snippet production output to the `/examples/tmp/<version_number>`. The path to the code snippet in the `/examples/tmp` follows the [Folder structure](#folder-structure) convention.
2. `npm run examples:start` - it will start the `http-server` right in the `/examples/tmp` on PORT `8080`. So the URL to the specific code snippet would be `http://localhost:8080/8.1.0/docs/angular/custom-context-menu/`. The URL follows the same convention as mentioned in the [Live on production](#live-on-production) section.

#### How to run the arbitrary code snippet

You may want to launch an arbitrary code snippet instead of a whole folder with all code snippets for a specific version. To do that you will need to copy the code snippet production output to the `/examples/tmp` directory. An example:

To launch only one code snippet which path is `/examples/8.1.0/docs/angular/custom-context-menu` you must copy the `dist` folder from this project and paste it to the `/examples/tmp/<your_temporary_folder_name>`. After done this, you can run `npm run examples:start` and see your code snippet under the URL `http://localhost:8080/<your_temporary_folder_name>/`

Also, each project has `npm run start` command which will start a development server. After this command is called, inside the code snippet directory, you can visit http://localhost:8080 to preview the project.

### Testing

Each code snippet has its own test specs, which lives in the `spec` directory.

> Templates have one **failing test**, which has been added to force developers to write passing tests for the next code snippets.

#### How to tun tests for arbitrary code snippet

Each code snippet has its own test suites which you can run in two ways:

1. Using development server:
 a. Run the `npm run start` command.
 b. After the app is launched on a server, run the `npm run jasmine` command which will launch tests specified to this code snippet.
2. Running server on the production output folder:
 a. Run the` npm run test` command which will first build the project then start the `http-server` on the production output folder then launch test specs and finally close the server.

#### How to run tests for the versioned code snippets locally

1. Code snippets **must** exist in the `examples/<version_number>` directory.
2. `npm run examples:test <version_number>`. This command will run `npm install` and `npm run test` for each code snippet (to know what the `npm run test` command does check out the section above).