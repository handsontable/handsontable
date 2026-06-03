---
type: how-to
id: h840od8r
title: Cell validator
metaTitle: Cell validator - JavaScript Data Grid | Handsontable
description: Validate data added or changed by the user, with predefined or custom rules. Validation helps you make sure that the data matches the expected format.
permalink: /cell-validator
canonicalUrl: /cell-validator
react:
  id: fvou30a5
  metaTitle: Cell validator - React Data Grid | Handsontable
angular:
  id: ut7amcaz
  metaTitle: Cell validator - Angular Data Grid | Handsontable
searchCategory: Guides
category: Cell functions
---

Cell validators run when a user finishes editing a cell. Use them to enforce data rules such as required fields, numeric ranges, or pattern matching.

[[toc]]

## Overview

When you create a validator, assign it an alias so you can reference it by name in column configuration. Handsontable defines 5 aliases by default:

- `autocomplete` for `Handsontable.validators.AutocompleteValidator`
- `date` for `Handsontable.validators.DateValidator`
- `dropdown` for `Handsontable.validators.DropdownValidator`
- `numeric` for `Handsontable.validators.NumericValidator`
- `time` for `Handsontable.validators.TimeValidator`

Aliases give you a convenient way to specify which validator runs when table validation triggers. You don't need to reference the validator function directly, and you can swap the function behind an alias without changing your column configuration.

## Register custom cell validator

To register your own alias use `Handsontable.validators.registerValidator()` function. It takes two arguments:

- `validatorName` - a string representing a validator function
- `validator` - a validator function that will be represented by `validatorName`

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

The final touch is to use the registered aliases, so that you can easily refer to them without knowing the actual validator function.

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

::: only-for javascript

```js
const container = document.querySelector('#container')
const hot = new Handsontable(container, {
  columns: [{
    validator: 'my.custom'
  }]
});
```

:::

::: only-for react

```jsx
<HotTable
  columns={[{
    validator: 'my.custom'
  }]}
/>
```

:::

::: only-for angular

```html
<hot-table [settings]="{
    columns: [{
        validator: 'my.custom'
    }]
  }">
</hot-table>
```

:::

::: only-for vue

```html
<HotTable :settings="{ columns: [{ validator: 'my.custom' }] }" />
```

:::

## Full featured example

Use the validator method to easily validate synchronous or asynchronous changes to a cell. If you need more control, [`beforeValidate`](@/api/hooks.md#beforevalidate) and [`afterValidate`](@/api/hooks.md#aftervalidate) hooks are available. In the below example, `email_validator_fn` is an async validator that resolves after 1000 ms.

Use the [`allowInvalid`](@/api/options.md#allowinvalid) option to define if the grid should accept input that does not validate. If you need to modify the input (e.g., censor bad words, uppercase first letter), use the plugin hook [`beforeChange`](@/api/hooks.md#beforechange).

By default, all invalid cells are marked by `htInvalid` CSS class. If you want to change class to another you can basically add the `invalidCellClassName` option to Handsontable settings. For example:

For the entire table

::: only-for javascript

```js
invalidCellClassName: 'myInvalidClass'
```

:::

::: only-for react

```jsx
invalidCellClassName="myInvalidClass"
```

:::

::: only-for angular

```ts
invalidCellClassName: 'myInvalidClass'
```

:::

::: only-for vue

```html
<HotTable :settings="{ invalidCellClassName: 'myInvalidClass' }" />
```

:::

For specific columns

::: only-for javascript

```js
columns: [
  { data: 'firstName', invalidCellClassName: 'myInvalidClass' },
  { data: 'lastName', invalidCellClassName: 'myInvalidSecondClass' },
  { data: 'address' }
]
```

:::

::: only-for react

```jsx
columns={[
  { data: 'firstName', invalidCellClassName: 'myInvalidClass' },
  { data: 'lastName', invalidCellClassName: 'myInvalidSecondClass' },
  { data: 'address' }
]}
```

:::

::: only-for angular

```ts
columns: [
  { data: 'firstName', invalidCellClassName: 'myInvalidClass' },
  { data: 'lastName', invalidCellClassName: 'myInvalidSecondClass' },
  { data: 'address' }
]
```

:::

::: only-for vue

```html
<HotTable :settings="{
  columns: [
    { data: 'firstName', invalidCellClassName: 'myInvalidClass' },
    { data: 'lastName', invalidCellClassName: 'myInvalidSecondClass' },
    { data: 'address' }
  ]
}" />
```

:::

Callback console log:

::: only-for javascript

::: example #example1 --js 2 --ts 3 --html 1

@[code](@/content/guides/cell-functions/cell-validator/javascript/example1.html)
@[code collapse={24-89}](@/content/guides/cell-functions/cell-validator/javascript/example1.js)
@[code collapse={25-90}](@/content/guides/cell-functions/cell-validator/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code collapse={32-97}](@/content/guides/cell-functions/cell-validator/react/example1.jsx)
@[code collapse={34-99}](@/content/guides/cell-functions/cell-validator/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code collapse={33-98}](@/content/guides/cell-functions/cell-validator/angular/example1.ts)
@[code](@/content/guides/cell-functions/cell-validator/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-functions/cell-validator/vue/example1.vue)

:::

:::

Edit the above grid to see the `changes` argument from the callback.

Mind that changes in table are applied after running all validators (both synchronous and and asynchronous) from every changed cell.

## Related API reference

**APIs**

<div class="boxes-list">

- [BasePlugin](@/api/basePlugin.md)

</div>

**Configuration options**

<div class="boxes-list">

- [allowEmpty](@/api/options.md#allowempty)
- [allowInvalid](@/api/options.md#allowinvalid)
- [invalidCellClassName](@/api/options.md#invalidcellclassname)
- [validator](@/api/options.md#validator)

</div>

**Core methods**

<div class="boxes-list">

- [getCellMeta()](@/api/core.md#getcellmeta)
- [getCellMetaAtRow()](@/api/core.md#getcellmetaatrow)
- [getCellsMeta()](@/api/core.md#getcellsmeta)
- [getCellValidator()](@/api/core.md#getcellvalidator)
- [setCellMeta()](@/api/core.md#setcellmeta)
- [setCellMetaObject()](@/api/core.md#setcellmetaobject)
- [removeCellMeta()](@/api/core.md#removecellmeta)
- [validateCell()](@/api/core.md#validatecell)
- [validateCells()](@/api/core.md#validatecells)
- [validateColumns()](@/api/core.md#validatecolumns)
- [validateRows()](@/api/core.md#validaterows)

</div>

**Hooks**

<div class="boxes-list">

- [afterGetCellMeta](@/api/hooks.md#aftergetcellmeta)
- [afterValidate](@/api/hooks.md#aftervalidate)
- [beforeGetCellMeta](@/api/hooks.md#beforegetcellmeta)
- [beforeValidate](@/api/hooks.md#beforevalidate)

</div>

## Result

You now have a cell validator that enforces data rules when a user finishes editing. Register it under an alias to reference it by name across your column configuration, and use `allowInvalid: false` to keep the editor open until the user enters a valid value.
