## Templates Guidline

This folder contains templates for new code examples. Each new code example should be created using the template from this folder. We have templates for examples made in React, Angular, Vue, and of course Vanilla JavaScript.

#### Prerequisite
To work with code examples (and Handsontable development in general) use at least Node version `15.9.0`. If you have Node Version Manager installed, you can just type in the terminal `nvm use`.

### Creating a new example

In this guideline, we will walk you through the process of creating new code examples. 

> If you need some inspiration, what can be done with code examples, go ahead see existing examples in `examples/next/docs/` to get inspired!

First off, create a new branch in order to keep the development process clean.

Inside the `examples/templates` directory where all templates for future code examples live. You can see that we have templates for examples made in React, Angular, Vue, and of course vanilla JavaScript.

To create a new code example in Vanilla JavaScript to be used in the Handsontable official documentation, we need to make use of the template from the `examples/templates/js` directory.

#### 1. Use the existing template

Copy the `examples/templates/js` directory and paste it into `examples/next/docs/js`.

In the next step rename the give that 'js' directory to a name that best describes the purpose of the code example, for instance, "sorting-data-custom-order". Make sure you keep the right file structure, like so:

```
examples/
├─ next/
│  ├─ docs/
│  │  ├─ js/
│  │  │  ├─ sorting-data-custom-order/
```

It's done! Now take a closer look at files inside templates.

#### 2. Template files

Every template has files that can be modified to match your needs. But there are some files that you **shouldn't modify** *unless* you know what you are doing (things can break). These files are either framework-specific: `angular.json`, `tsconfig*.json`, `config-overrides.js`, `vue.config.js`, `babel.config.js` or common for every template: `spec/support/jasmine.config.js`.

What you **should modify** though is the `README.md` file. You should add code example-specific content between curly braces. Note: "Live preview" section should have a link to the CodeSandbox, but it won't work until this example is pushed to the repo. You can learn more about CodeSandbox links [here](../#live-on-production).

Another important file is a `package.json` file. Some properties of this file should be the same for every new code example and **shouldn't be modified** (except `"@handsontable/{{ WRAPPER NAME }}"`):

```javascript
{
  "version": "0.0.0", // will be overwritten on new version created,
  "homepage": "https://handsontable.com/",
  "private": true,
  "repository": {
    "type": "git",
    "url": "https://github.com/handsontable/handsontable.git"
  },
  "bugs": {
    "url": "https://github.com/handsontable/handsontable/issues"
  },
  "author": "Handsoncode <hello@handsontable.com>",
  "license": "SEE LICENSE IN LICENSE.txt",
  "dependencies": {
    "handsontable": "latest",
    "@handsontable/{{ WRAPPER NAME }}": "latest" // only for frameworks, e.g. "@handsontable/react": "latest"
  }
}
```

In `package.json` are also scripts ***you should never modify or remove***, because those scripts are used by our CI/CD pipeline : `npm run start`, `npm run build` and `npm run test`.

The only thing you have to modify is `"name"`, `"description"` and `"@handsontable/{{ WRAPPER NAME }}"` (if you are creating a code example made in a framework like React, Angular, or Vue). And, of course, you can install dependencies.

#### 3. Develop

After the dependencies are installed, run npm run start that builds the project and watches for any saved code changes. The command opens the project on port 8080 so you can open the example in your browser at `localhost:8080`.

#### 4. Publishing

After you're done, `git add examples/next`, `git commit` and `git push` your new code examples to the Handsontable repo. Open a new PR and wait for the review!
