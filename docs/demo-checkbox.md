---
id: demo-checkbox
title: Checkbox
sidebar_label: Checkbox
slug: /demo-checkbox
---

function getCarData() { return \[ {car: "Mercedes A 160", year: 2017, available: true, comesInBlack: 'yes'}, {car: "Citroen C4 Coupe", year: 2018, available: false, comesInBlack: 'yes'}, {car: "Audi A4 Avant", year: 2019, available: true, comesInBlack: 'no'}, {car: "Opel Astra", year: 2020, available: false, comesInBlack: 'yes'}, {car: "BMW 320i Coupe", year: 2021, available: false, comesInBlack: 'no'} \]; }

*   [Checkbox true/false values](#default)
*   [Checkbox template](#template)
*   [Checkbox labels](#labels)

Data in such cells will be rendered as checkbox and can be easily changed by checking/unchecking the checkbox.

Checking and unchecking can be performed using mouse or by pressing SPACE. You can change the state of multiple cells at once. Simply select cells you want to change and press SPACE

### Checkbox true/false values

This is default usage scenario when columns data have `true` or `false` value and we want to display only checkboxes.

Edit Log to console

var example1 = document.getElementById('example1'), hot1; hot1 = new Handsontable(example1, { data: getCarData(), colHeaders: \['Car model', 'Year of manufacture', 'Available'\], columns: \[ { data: 'car' }, { data: 'year', type: 'numeric' }, { data: 'available', type: 'checkbox' } \] });

### Checkbox template

If you want use other values than `true` and `false`, you have to provide this information using `checkedTemplate` and `uncheckedTemplate`. Handsontable will then update your data using appropriate template.

Edit Log to console

var example2 = document.getElementById('example2'); var hot2 = new Handsontable(example2, { data: getCarData(), colHeaders: \['Car model', 'Year of manufacture', 'Comes in black'\], columns: \[ { data: 'car' }, { data: 'year', type: 'numeric' }, { data: 'comesInBlack', type: 'checkbox', checkedTemplate: 'yes', uncheckedTemplate: 'no' } \] });

### Checkbox labels

If you want to add label to the checkbox you can use `label` option. With this option you can declare where label will be injected (before or after checkbox element) and from what data source label text will be updated.

Edit Log to console

var example3 = document.getElementById('example3'); var hot3 = new Handsontable(example3, { data: getCarData(), colHeaders: \['Car model', 'Accepted', 'Comes in black'\], columns: \[ { data: 'car' }, { data: 'available', type: 'checkbox', label: { position: 'after', property: 'car' // Read value from row object }, }, { data: 'comesInBlack', type: 'checkbox', checkedTemplate: 'yes', uncheckedTemplate: 'no', label: { position: 'before', value: 'In black? ' }, }, \] });

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/checkbox.html)
