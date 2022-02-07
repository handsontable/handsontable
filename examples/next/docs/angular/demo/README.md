# Demo

## Description

This is a general purpose demo that showcases the most popular features of Handsontable in Angular.

## How to run this example

### Installation

Call `npm install` to install all necessary dependencies.

### Development

To start local development server call `npm run start`. Now you can visit http://localhost:8080 to view this project.

### Testing

In order to run tests for this project call `npm run start` which will launch the development server and after the server is running, call `npm run test` to run test specs.

### Forking

This example is one of the projects in a [large monorepo](https://github.com/handsontable/handsontable/). If you want to modify it, you can fork the entire monorepo on GitHub. 

But for some use cases, it will be desired to copy only one specific example into a new repository. To do it, simply extract this folder alone. You can do that by running all of the commands listed below while being in the folder of the example:

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
# if you want, initiate a new Git repository there
git init
git add .
git commit -m "initial commit in my fork of the Handsontable example"
# install dependencies and start the example
npm install
npm run start
```

## License

Handsontable is a commercial software with two licenses available:

- Free for non-commercial purposes such as teaching, academic research, and evaluation. [Read it here](https://github.com/handsontable/handsontable/blob/master/handsontable-non-commercial-license.pdf).
- Commercial license with support and maintenance included. See [pricing plans](https://handsontable.com/pricing).

## Contact support

We provide support for all users through [GitHub issues](https://github.com/handsontable/handsontable/issues). If you have a commercial license then you can add a new ticket through the [contact form](https://handsontable.com/contact?category=technical_support).
