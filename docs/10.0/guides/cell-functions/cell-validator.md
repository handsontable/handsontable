---
title: Cell validator
metaTitle: Cell validator - Guide - Handsontable Documentation
permalink: /10.0/cell-validator
canonicalUrl: /cell-validator
---

# Cell validator

[[toc]]

When you create a validator, a good idea is to assign it as an alias that will refer to this particular validator function. Handsontable defines 5 aliases by default:

* `autocomplete` for `Handsontable.validators.AutocompleteValidator`
* `date` for `Handsontable.validators.DateValidator`
* `dropdown` for `Handsontable.validators.DropdownValidator`
* `numeric` for `Handsontable.validators.NumericValidator`
* `time` for `Handsontable.validators.TimeValidator`

It gives users a convenient way for defining which validator should be used when table validation was triggered. User doesn't need to know which validator function is responsible for checking the cell value, he does not even need to know that there is any function at all. What is more, you can change the validator function associated with an alias without a need to change code that defines a table.

## Registering custom cell validator

To register your own alias use `Handsontable.validators.registerValidator()` function. It takes two arguments:

* `validatorName` - a string representing a validator function
* `validator` - a validator function that will be represented by `validatorName`

If you'd like to register `creditCardValidator` under alias `credit-card` you have to call:

```js
Handsontable.validators.registerValidator('credit-card', creditCardValidator);
```

Choose aliases wisely. If you register your validator under name that is already registered, the target function will be overwritten:

```js
Handsontable.validators.registerValidator('date', creditCardValidator);
```
Now 'date' alias points to `creditCardValidator` function, not `Handsontable.validators.DateValidator`.


So, unless you intentionally want to overwrite an existing alias, try to choose a unique name. A good practice is prefixing your aliases with some custom name (for example your GitHub username) to minimize the possibility of name collisions. This is especially important if you want to publish your validator, because you never know aliases has been registered by the user who uses your validator.

```js
Handsontable.validators.registerValidator('credit-card', creditCardValidator);
```

Someone might already registered such alias.

```js
Handsontable.validators.registerValidator('my.credit-card', creditCardValidator);
```

That's better.

## Using an alias

The final touch is to use the registered aliases, so that users can easily refer to it without the need to now the actual validator function is.

To sum up, a well prepared validator function should look like this:

```js
(Handsontable => {
  function customValidator(query, callback) {
    // ...your custom logic of the validator

    callback(/* Pass `true` or `false` based on your logic */);
  }

  // Register an alias
  Handsontable.validators.registerValidator('my.custom', customValidator);

})(Handsontable);
```

From now on, you can use `customValidator` like so:

```js
const container = document.querySelector('#container')
const hot = new Handsontable(container, {
  columns: [{
    validator: 'my.custom'
  }]
});
```

## Full featured example

Use the **validator**  method to easily validate synchronous or asynchronous changes to a cell. If you need more control, **beforeValidate** and **afterValidate** plugin hooks are available. In the below example, `email_validator_fn` is an async validator that resolves after 1000 ms.

Use the **allowInvalid** option to define if the grid should accept input that does not validate. If you need to modify the input (e.g. censor bad words, uppercase first letter), use the plugin hook **beforeChange**.

By default, all invalid cells are marked by `htInvalid` CSS class. If you want to change class to another you can basically add the `invalidCellClassName` option to Handsontable settings. For example:

For whole table
```js
invalidCellClassName: 'myInvalidClass'
```

For specific columns
```js
columns: [
  { data: 'firstName', invalidCellClassName: 'myInvalidClass' },
  { data: 'lastName', invalidCellClassName: 'myInvalidSecondClass' },
  { data: 'address' }
]
```

Callback console log:

::: example #example1 --js 2 --html 1
```html
<div id="example1"></div>
<pre class="language-js">
  <code id="example1console">Here you will see the log</code>
</pre>
```
```js
const container = document.querySelector('#example1');
const console = document.querySelector('#example1console');

const ipValidatorRegexp = /^(?:\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b|null)$/;

const emailValidator = (value, callback) => {
  setTimeout(() => {
    if (/.+@.+/.test(value)) {
      callback(true);

    } else {
      callback(false);
    }
  }, 1000);
};

const hot = new Handsontable(container, {
  data: [
    { id: 1, name: { first: 'Joe', last: 'Fabiano' }, ip: '0.0.0.1', email: 'Joe.Fabiano@ex.com' },
    { id: 2, name: { first: 'Fred', last: 'Wecler' }, ip: '0.0.0.1', email: 'Fred.Wecler@ex.com' },
    { id: 3, name: { first: 'Steve', last: 'Wilson' }, ip: '0.0.0.1', email: 'Steve.Wilson@ex.com' },
    { id: 4, name: { first: 'Maria', last: 'Fernandez' }, ip: '0.0.0.1', email: 'M.Fernandez@ex.com' },
    { id: 5, name: { first: 'Pierre', last: 'Barbault' }, ip: '0.0.0.1', email: 'Pierre.Barbault@ex.com' },
    { id: 6, name: { first: 'Nancy', last: 'Moore' }, ip: '0.0.0.1', email: 'Nancy.Moore@ex.com' },
    { id: 7, name: { first: 'Barbara', last: 'MacDonald' }, ip: '0.0.0.1', email: 'B.MacDonald@ex.com' },
    { id: 8, name: { first: 'Wilma', last: 'Williams' }, ip: '0.0.0.1', email: 'Wilma.Williams@ex.com' },
    { id: 9, name: { first: 'Sasha', last: 'Silver' }, ip: '0.0.0.1', email: 'Sasha.Silver@ex.com' },
    { id: 10, name: { first: 'Don', last: 'Pérignon' }, ip: '0.0.0.1', email: 'Don.Pérignon@ex.com' },
    { id: 11, name: { first: 'Aaron', last: 'Kinley' }, ip: '0.0.0.1', email: 'Aaron.Kinley@ex.com' }
  ],
  beforeChange(changes, source) {
    for (let i = changes.length - 1; i >= 0; i--) {
      // gently don't accept the word "foo" (remove the change at index i)
      if (changes[i][3] === 'foo') {
        changes.splice(i, 1);
      }
      // if any of pasted cells contains the word "nuke", reject the whole paste
      else if (changes[i][3] === 'nuke') {
        return false;
      }
      // capitalise first letter in column 1 and 2
      else if ((changes[i][1] === 'name.first' || changes[i][1] === 'name.last')) {
        if(changes[i][3] !== null){
          changes[i][3] = changes[i][3].charAt(0).toUpperCase() + changes[i][3].slice(1);
        }
      }
    }
  },
  afterChange(changes, source) {
    if (source !== 'loadData') {
      console.innerText = JSON.stringify(changes);
    }
  },
  colHeaders: ['ID', 'First name', 'Last name', 'IP', 'E-mail'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    { data: 'id', type: 'numeric' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'ip', validator: ipValidatorRegexp, allowInvalid: true },
    { data: 'email', validator: emailValidator, allowInvalid: false }
  ]
});
```
:::

Edit the above grid to see callback

**Note:** Please keep in mind that changes in table are applied after running **all validators** (both synchronous and and asynchronous) from **every** changed cells.
