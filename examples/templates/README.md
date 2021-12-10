## Templates guideline

This folder contains templates for new code examples. Each new code example should be created using the template from this folder. We have templates for examples made in React, Angular, Vue, and of course Vanilla JavaScript.

#### Prerequisites
The lowest version of Node.js required for working with this project is `15.9.0`. If you use `nvm` (Node Version Manager) and already installed the minimum supported version, just type the following command in the terminal: `nvm use`.

### Creating a new example

In this guideline, we will walk you through the process of creating new code examples. 

> If you want to get inspired before moving forward, see the already existing code examples in the folder `examples/next/docs/`.

First off, create a new branch in order to keep the development process clean.

Inside the `examples/templates` directory where all templates for future code examples live. You can see that we have templates for examples made in React, Angular, Vue, and of course Vanilla JavaScript.

To create a new code example in Vanilla JavaScript to be used in the Handsontable official documentation, we need to make use of the template from the `examples/templates/js` directory.

#### 1. Copy the existing template

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

What you **should modify** though is the `README.md` file. You should add code example-specific content between curly braces. Note: "Live preview" section should have a link to CodeSandbox, but it won't work until this example is pushed to the repo. You can learn more about CodeSandbox links [here](../#live-on-production).

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

In the `package.json` you can find scripts that **should not be modified or removed**, such as `npm run start`, `npm run build` or `npm run test`. We use them internally to run the jobs in the CI/CD pipeline

##### Creating a code sample for framework

You need to update the `package.json` file if you build a code sample that is intended to work with JavaScript frameworks such as React, Angular, or Vue. 

The properties to modify include `"name"`, `"description"` and `"@handsontable/{{ WRAPPER NAME }}"`. Also, don't forget to define dependencies if you use them in your code.

#### 3. Develop

When the dependencies are already installed, run the `npm run start` command. It builds the projects and enables the watcher that reacts to any change in the code. The project can be previewed at `localhost:8080`.

#### 4. Create a pull request

Now you have written your code, it is ready to be pushed. 

Follow the steps below to make it possible:
- `git add examples`
- `git commit`
- `git push`

After completing these steps you can open a PR on GitHub, and assign a reviewer.
