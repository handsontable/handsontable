---
id: contributing
title: Contributing
sidebar_label: Contributing
slug: /contributing
---

Your contributions to this project are very welcome. If you want to fix a bug or propose a new feature, you can open a new Pull Request but first make sure it follows these general rules:

1.  Sign this [Contributor License Agreement](//goo.gl/forms/yuutGuN0RjsikVpM2) to allow us to publish your changes to the code.
2.  Make your changes on a separate branch. This will speed up the merging process.
3.  Always make the target of your pull request the `develop` branch, not `master`.
4.  Do not edit files in `dist/` (e.g: `handsontable.js`, `handsontable.css`, `handsontable.full.js`, `handsontable.full.css`, `languages/all.js`) and `languages/` (e.g: `en-US.js`, `pl-PL.js`) directories. Instead, edit files inside the `src/` directory and then use `npm run build` to make a build. More information about this you can find [here](custom-build.md).
5.  **Important:** For any change you make, please add at least one test case** in `test/e2e/` (for End-to-End tests), `test/unit/` or `src/3rdparty/walkontable/test/spec/`. That will help us understand the issue and make sure that it stays fixed forever. Read more about our [testing process](testing.md).
6.  Please lint the code, i.e. by `npm run lint` task. It should follow [our coding style](https://github.com/handsontable/handsontable/blob/master/.eslintrc), inspired by [Airbnb JavaScript Style](https://github.com/airbnb/javascript).
7.  Add a thorough description of all the changes.

**Thank you for your commitment!**
