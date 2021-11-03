---
title: Password cell type
metaTitle: Password cell type - Guide - Handsontable Documentation
permalink: /10.0/password-cell-type
canonicalUrl: /password-cell-type
---

# Password cell type

[[toc]]

## Overview

The password cell type behaves like a text cell, the only difference being that it masks its value using asterisks in the cell renderer. An `<input type="password">` field is used for the cell editor. Data is stored in the data source as plain text.

::: example #example1
```js
const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: [
    { id: 1, name: { first: 'Chris', last: 'Right' }, password: 'plainTextPassword' },
    { id: 2, name: { first: 'John', last: 'Honest' }, password: 'txt' },
    { id: 3, name: { first: 'Greg', last: 'Well' }, password: 'longer' }
  ],
  colHeaders: ['ID', 'First name', 'Last name', 'Password'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    { data: 'id' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'password', type: 'password' }
  ]
});
```
:::

## Fixed hash length

By default, every hash has a length equal to the length of its corresponding value. Use option `hashLength` to set a fixed hash length.

::: example #example2
```js
const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data: [
    { id: 1, name: { first: 'Chris', last: 'Right' }, password: 'plainTextPassword' },
    { id: 2, name: { first: 'John', last: 'Honest' }, password: 'txt' },
    { id: 3, name: { first: 'Greg', last: 'Well' }, password: 'longer' }
  ],
  colHeaders: ['ID', 'First name', 'Last name', 'Password'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    { data: 'id' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'password', type: 'password', hashLength: 10 }
  ]
});
```
:::

## Custom hash symbol

By default, every hash consists of asterisks `*`. Use the option `hashSymbol` to set a custom hash symbol. You can use any character, entity, or event HTML. Note that you can't change the symbol used by the input field due to browser limitations.

::: example #example3
```js
const container = document.querySelector('#example3');

const hot = new Handsontable(container, {
  data: [
    { id: 1, name: { first: 'Chris', last: 'Right' }, password: 'plainTextPassword' },
    { id: 2, name: { first: 'John', last: 'Honest' }, password: 'txt' },
    { id: 3, name: { first: 'Greg', last: 'Well' }, password: 'longer' }
  ],
  colHeaders: ['ID', 'First name', 'Last name', 'Password'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    { data: 'id' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'password', type: 'password', hashSymbol: '&#9632;' }
  ]
});
```
:::
