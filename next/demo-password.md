---
id: demo-password
title: Password
sidebar_label: Password
slug: /demo-password
---

function getCarData() { return \[ {id: 1, name: {first: "Chris", last: "Right"}, password: "plainTextPassword"}, {id: 2, name: {first: "John", last: "Honest"}, password: "txt"}, {id: 3, name: {first: "Greg", last: "Well"}, password: "longer"} \]; }

*   [Password cell type](#type)
*   [Fixed hash length](#length)
*   [Custom hash symbol](#symbol)

### Password cell type

This kind of cell behaves like a text cell with a difference that it masks its value using asterisk in cell renderer. For the cell editor, a `<input type="password">` field is used. Data is stored in the data source as plain text.

Edit Log to console

var example1 = document.getElementById('example1'), hot1; hot1 = new Handsontable(example1, { data: getCarData(), colHeaders: \['ID', 'First name', 'Last name', 'Password'\], columns: \[ {data: 'id'}, {data: 'name.first'}, {data: 'name.last'}, {data: 'password', type: 'password'} \] });

### Fixed hash length

By default every hash has length equal to the length of value that it corresponds with. Use option `hashLength` to set fixed hash length.

Edit Log to console

var example2 = document.getElementById('example2'), hot2; hot2 = new Handsontable(example2, { data: getCarData(), colHeaders: \['ID', 'First name', 'Last name', 'Password'\], columns: \[ {data: 'id'}, {data: 'name.first'}, {data: 'name.last'}, {data: 'password', type: 'password', hashLength: 10} \] });

### Custom hash symbol

By default every hash consists of asterisks `*`. Use option `hashSymbol` to set custom hash symbol. You can use any character, entity or event HTML. Note that you can't change symbol used by the input field due to browsers limitations.

Edit Log to console

var example3 = document.getElementById('example3'), hot3; hot1 = new Handsontable(example3, { data: getCarData(), colHeaders: \['ID', 'First name', 'Last name', 'Password'\], columns: \[ {data: 'id'}, {data: 'name.first'}, {data: 'name.last'}, {data: 'password', type: 'password', hashSymbol: '&#9632;'} \] });

