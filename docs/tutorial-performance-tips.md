---
id: tutorial-performance-tips
title: Performance tips
sidebar_label: Performance tips
slug: /tutorial-performance-tips
---

Handsontable performs multiple calculations to display the grid properly. The most demanding actions are performed on load, change and scroll events. Every single operation decreases the performance, but most of them are unavoidable.

We use Performance Lab to measure the execution times in various configurations. Some tests have shown that there are methods which may potentially boost the performance of your application. Those work only in certain cases, but we hope they can be successfully applied to your app as well.

### Set constant size

You can try setting a constant size for your table's columns. This way, Handsontable won't have to calculate the optimal width for each column. In order to do that, define the column widths in the colWidths property of your Handsontable instance configuration, for example:

    var hot = new Handsontable(obj, {
        // other options
        colWidths: [50, 150, 45]
    });

For more information, see [our documentation](/docs/8.2.0/Options.html#colWidths).

As Handsontable won't do the column width calculations, you need to make sure, that your table contents fit inside the columns with the provided widths.

### Turn off autoRowSize and/or autoColumnSize

You can tweak the value of the `autoRowSize` and `autoColumnSize` options. They allow you to define the amount of width/height-related calculations made during the table's initialization.

For more information, see our documentation for [rows](/docs/8.2.0/Options.html#autoRowSize) and [columns](/docs/8.2.0/Options.html#autoColumnSize).

### Define the number of pre-rendered rows and columns

You can explicitly specify the number of rows and columns to be rendered outside of the visible part of the table. In some cases you can achieve better results by setting a lower number (as less elements get rendered), but sometimes setting a larger number may also work well (as less operations are being made on each scroll event). Tweaking these settings and finding the sweet spot may improve the feeling of your Handsontable implementation.

For more information, see our documentation for [rows](/docs/8.2.0/Options.html#viewportRowRenderingOffset) and [columns](/docs/8.2.0/Options.html#viewportColumnRenderingOffset).

### Rule of thumb: don't use too much styling

Changing your background, font colors etc. shouldn't lower the performance, however adding too many CSS animations, transitions and other calculation-consuming attributes may impact the performance, so keep them at a reasonable level.

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/performance-tips.html)
