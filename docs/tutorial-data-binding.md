---
id: tutorial-data-binding
title: Data binding
sidebar_label: Data binding
slug: /tutorial-data-binding
---

*   [Understand binding as reference](#page-reference)
*   [Working with copy of data](#page-copy)

### Understand binding as a reference

Handsontable binds to your [data source](/docs/8.2.0/tutorial-data-sources.html) (list of arrays or list of objects) by reference (not by values, we don't copy input dataset; we rely on the way how JavaScript handle objects). Therefore, all the data entered in the grid will alter the original data source.

**Note:** You should know the fact that Handsontable initialize source data for the table using a reference, but you shouldn't rely on it. For example, you shouldn't change values in source data using the reference to input dataset. Some mechanisms for handling data aren't prepared for changes from the outside, done in this way.

If you have to avoid that, [copy the data](#page-copy) before you pass it to the grid. To change the data from outside Handsontable you can use our API methods, f.e. a change being made will be displayed immediately on the screen after calling [setDataAtCell](/docs/8.2.0/Core.html#setDataAtCell) method.

Edit Log to console

var data1 = \[ \['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'\], \['2017', 10, 11, 12, 13, 15, 16\], \['2018', 10, 11, 12, 13, 15, 16\], \['2019', 10, 11, 12, 13, 15, 16\], \['2020', 10, 11, 12, 13, 15, 16\], \['2021', 10, 11, 12, 13, 15, 16\] \], container1 = document.getElementById('example1'), settings1 = { data: data1 }, hot1; hot1 = new Handsontable(container1, settings1); hot1.setDataAtCell(0, 1, 'Ford');

### Working with copy of data

In case you want to keep a separate working copy of data for Handsontable, it is suggested to clone the data source before loading it into Handsontable. This can be done with `JSON.parse(JSON.stringify(data))` or another deep-cloning function.

Edit Log to console

var data2 = \[ \['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'\], \['2017', 10, 11, 12, 13, 15, 16\], \['2018', 10, 11, 12, 13, 15, 16\], \['2019', 10, 11, 12, 13, 15, 16\], \['2020', 10, 11, 12, 13, 15, 16\], \['2021', 10, 11, 12, 13, 15, 16\] \], container2 = document.getElementById('example2'), hot2; hot2 = new Handsontable(container2, { data: JSON.parse(JSON.stringify(data2)) });

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/data-binding.html)
