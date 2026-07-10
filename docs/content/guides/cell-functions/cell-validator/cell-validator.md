---
type: how-to
title: Cell validator
metaTitle: Cell validator - JavaScript Data Grid | Handsontable
description: Validate data added or changed by the user, with predefined or custom rules. Validation helps you make sure that the data matches the expected format.
permalink: /cell-validator
canonicalUrl: /cell-validator
react:
  metaTitle: Cell validator - React Data Grid | Handsontable
angular:
  metaTitle: Cell validator - Angular Data Grid | Handsontable
vue:
  metaTitle: Cell validator - Vue Data Grid | Handsontable
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

### Invalid cell commit semantics vs. visual marking

When a validator returns `false`, Handsontable independently controls two separate outcomes:

- **Commit behavior** — controlled by [`allowInvalid`](@/api/options.md#allowinvalid). When `true` (the default), the invalid value is written to the data source and the editor closes. When `false`, the editor stays open and the value is rejected until the user enters something that passes validation.
- **Visual marking** — controlled by [`invalidCellClassName`](@/api/options.md#invalidcellclassname). Regardless of [`allowInvalid`], Handsontable applies a CSS class to every cell whose validator returned `false`. The default class is htInvalid; you can replace it per-column or table-wide using [`invalidCellClassName`].

The following snippet shows both options used together on a single column:

::: only-for javascript

```js
columns: [
  {
    data: 'ip',
    validator: ipValidatorRegexp,
    allowInvalid: true,          // keep the value even when invalid
    invalidCellClassName: 'my-invalid-cell' // apply a custom CSS class
  }
]
```

:::

These two options work independently. You can configure [`allowInvalid`] and [`invalidCellClassName`] together without one affecting the other.

::: only-for react

```jsx
columns={[
  {
    data: 'ip',
    validator: ipValidatorRegexp,
    allowInvalid: true,
    invalidCellClassName: 'my-invalid-cell'
  }
]}
```

:::

::: only-for angular

```ts
columns: [
  {
    data: 'ip',
    validator: ipValidatorRegexp,
    allowInvalid: true,
    invalidCellClassName: 'my-invalid-cell'
  }
]
```

:::

::: only-for vue

```html
<HotTable :settings="{
  columns: [
    {
      data: 'ip',
      validator: ipValidatorRegexp,
      allowInvalid: true,
      invalidCellClassName: 'my-invalid-cell'
    }
  ]
}" />
```

:::

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
  } ]}
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

## Validate decimal numbers with dot or comma separators

Use a custom validator when a column must accept decimal values with either `.` or `,` as the decimal separator. The following example validates campaign conversion rates. It accepts values such as `3.4` and `8,1`, and rejects values that do not match the decimal format.

:::: only-for javascript

:::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-validator/javascript/example2.js)
@[code](@/content/guides/cell-functions/cell-validator/javascript/example2.ts)

::::

::::

:::: only-for react

:::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-functions/cell-validator/react/example2.jsx)
@[code](@/content/guides/cell-functions/cell-validator/react/example2.tsx)

::::

::::

:::: only-for angular

:::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-functions/cell-validator/angular/example2.ts)
@[code](@/content/guides/cell-functions/cell-validator/angular/example2.html)

::::

::::

:::: only-for vue

:::: example #example2 :vue3

@[code](@/content/guides/cell-functions/cell-validator/vue/example2.vue)

::::

::::

## Full featured example

Use the validator method to easily validate synchronous or asynchronous changes to a cell. If you need more control, [`beforeValidate`](@/api/hooks.md#beforevalidate) and [`afterValidate`](@/api/hooks.md#aftervalidate) hooks are available. In the below example, `email_validator_fn` is an async validator that resolves after 1000 ms.

Use the [`allowInvalid`](@/api/options.md#allowinvalid) option to define if the grid should accept input that does not validate. If you need to modify the input (e.g., censor bad words, uppercase first letter), use the plugin hook [`beforeChange`](@/api/hooks.md#beforechange).

By default, all invalid cells are marked by the <code>htInvalid</code> CSS class. If you want to use a different class name, set <code>invalidCellClassName</code> — this replaces <code>htInvalid</code> for the affected cells. Add a CSS rule in your stylesheet for the chosen class. To apply a custom class name, add the <code>invalidCellClassName</code> option to your Handsontable settings. For example:

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
columns=[
  { data: 'firstName', invalidCellClassName: 'myInvalidClass' },
  { data: 'lastName', invalidCellClassName: 'myInvalidSecondClass' },
  { data: 'address' }
]
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

### FAQ: Does the invalid CSS class still apply when <code>allowInvalid</code> is <code>true</code>?

**Yes.** When <code>allowInvalid</code> is and a validator returns <code>false</code>, the value is written to the data source (the editor closes normally), but Handsontable still applies the invalid CSS class to the cell. By default that class is <code>htInvalid</code>; you can change it per-column or globally with the [`invalidCellClassName`](/docs/javascript-data-grid/api/options/#invalidcellclassname) option. The two concerns — whether to accept the value and how to mark the cell — are fully independent. See also the [`allowInvalid`](/docs/javascript-data-grid/api/options/#allowinvalid) option for details.

## Result

You now have a cell validator that enforces data rules when a user finishes editing. Register it under an alias to reference it by name across your column configuration. Use <code>allowInvalid</code> set to false to keep the editor open until the user enters a valid value, or <code>allowInvalid</code> set to true to accept the value while still visually flagging the cell. Use <code>invalidCellClassName</code> to customise the CSS class applied to cells that fail validation — the default is <code>htInvalid</code>.

## Related API reference

**APIs**

<div class="boxes-list">

- [BasePlugin](@/api/basePlugin.md)

</div>

**Configuration options**

<div class="boxes-list">

- [allowEmpty](@/api/options.md#allowempty)
- <code>allowInvalid</code> (@/api/options.md#allowinvalid) — controls whether an invalid value is committed to the data source
- <code>invalidCellClassName</code> (@/api/options.md#invalidcellclassname) — sets the CSS class applied to cells that fail validation (default: <code>htInvalid</code>)
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
