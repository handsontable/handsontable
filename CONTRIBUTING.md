# Contributing to Handsontable

Your contributions to this project are very welcome. If you want to fix a bug or propose a new feature, you can open a new Pull Request but first make sure it follows these general rules:

1. Sign this [Contributor License Agreement](https://goo.gl/forms/yuutGuN0RjsikVpM2) to allow us to publish your changes to the code.
2. Make changes to the appropriate project. `handsontable` is located at the root of the repository - the framework-specific wrappers in the `./wrappers` subdirectory.
3. Make your changes on a separate branch. This will speed up the merging process.
4. Always make the target of your pull request the `develop` branch, not `master`.
5. Do not edit files in `dist/` (e.g: `handsontable.js`, `handsontable.css`, `handsontable.full.js`, `handsontable.full.css`, `languages/all.js`), `languages/` (e.g: `en-US.js`, `pl-PL.js`), `commonjs` and `es` directories as well as their analogous counterparts in the `wrappers/` subdirectories. Instead, edit files inside the `src/` directory and then use `npm run build` (or `npm run all build`) to make a build. More information about this you can find [here](http://docs.handsontable.com/tutorial-custom-build.html).
6. **Important: For any change you make, please add at least one test case** in `test/e2e/` (for End-to-End tests), `test/unit/` or `src/3rdparty/walkontable/test/spec/`. That will help us understand the issue and make sure that it stays fixed forever. If you're making changes to the framework-specific wrappers, add tests to the test directories in their respective subdirectories. Read more about our [testing process](http://docs.handsontable.com/tutorial-testing.html).
7. Please lint the code, i.e. by `npm run lint` task. It should follow [our coding style](https://github.com/handsontable/handsontable/blob/master/.eslintrc.js), inspired by [Airbnb JavaScript Style](https://github.com/airbnb/javascript).
8. Add a thorough description of all the changes.

Thank you for your commitment!

## Team rules

1. We're using `npm workspaces` - this requires you to use `npm@7+`.
2. The Handsontable team utilizes Git-Flow. Read more - [How we use Git-Flow](https://github.com/handsontable/handsontable/wiki/How-we-use-Git-Flow)
