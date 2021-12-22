# Contributing to Handsontable

Your contribution to Handsontable's codebase is most welcome. To fix a bug or propose a new feature, open a new pull request (PR), targeted at the `develop` branch.

To speed up the process of merging your changes, follow these rules:

1. Sign the [Contributor License Agreement](https://goo.gl/forms/yuutGuN0RjsikVpM2), to let us publish your changes.
2. Make your changes on a separate branch. This will speed up the merging process.
3. Always target your PR at the `develop` branch, not the `master` branch.
4. Make changes to the right project:
    - The main Handsontable project is located in the `./handsontable/` directory.
    - Framework wrapper projects are located in the `./wrappers/` directory.
5. Don't edit files in the following directories:
    - `./handsontable/dist/`
    - `./wrappers/angular/dist/hot-table/`
    - `./wrappers/react/dist/` & `./wrappers/react/es/` & `./wrappers/react/commonjs/`
    - `./wrappers/vue/dist/` & `./wrappers/vue/es/` & `./wrappers/vue/commonjs/`
    - `./handsontable/languages/`
6. Instead, edit the source files, located in the following directories:
    - `./handsontable/src/`
    - `./wrappers/angular/projects/hot-table/src/`
    - `./wrappers/react/src/`
    - `./wrappers/vue/src/`<br>
    To check your changes, [make a build](https://handsontable.com/docs/building/), but don't commit your build files.
7. For any change you make, add at least one test case. Your tests will help us understand the issue and make sure it stays fixed forever. Read more about our [testing process](https://handsontable.com/docs/testing/).<br>
   For the main Handsontable project, add your tests to one of the following directories:
    - `test/e2e/`
    - `test/unit/`
    - `./handsontable/src/3rdparty/walkontable/test/spec/`<br>
   For a framework wrapper project, add your tests to the respective wrapper's test directory.
8. Lint your code.<br>
   From the root directory, run: `npm run lint`.<br>
   Your code should follow [our coding style](https://github.com/handsontable/handsontable/blob/master/.eslintrc.js), inspired by the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript).
9. Add a mandatory [changelog](https://github.com/handsontable/handsontable/blob/master/CHANGELOG.md) entry.<br>
   From the root directory, run: `npm run changelog entry`.
10. In your PR, add a thorough description of all the changes.

Thank you for your contribution!

## Team rules

1. We use [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces). This requires you to use `npm@7+`.
2. We use the Gitflow workflow.