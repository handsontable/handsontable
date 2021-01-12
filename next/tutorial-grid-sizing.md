---
id: tutorial-grid-sizing
title: Grid sizing
sidebar_label: Grid sizing
slug: /tutorial-grid-sizing
---

*   [Introduction](#introduction)
*   [How to set up dimensions](#how-to-set-up-dimensions)
*   [What if dimensions are not set up](#what-if-dimensions-are-not-set-up)
*   [Autoresizing](#autoresizing)
*   [Manual resizing](#manual-resizing)

### Introduction

To set up Handsontable DOM structure in your application, you have to define its container as a starting point to initialise component. Usually, the `div` element becomes this container. This container should have defined dimensions as well as the rest of your layout. Since v7.0.0, Handsontable supports relative units such as `%`, `rem`, `em`, `vh`, `vw` or as exact size in `px`.

### How to set up dimensions

There are two possible ways to define a table size.

1.  #### Using CSS styles

    Both `width` and `height` could be defined as inline styles or as a CSS class property. In this case, it's important to properly define what should be an `overflow` parent. Handsontable looks for the closest element with `overflow: auto` or `overflow: hidden` to use it as a scrollable container. If no such element is found a window will be used.

    Handsontable doesn't observe CSS changes for container out of the box.
    If you'd like to observe it, you can define dimensions in configuration object or create your own observer.

2.  #### Configuration object

        {
          width: '100px',
          width: '75%',
          width: 100 // For backward compatibility we parse number into pixels
        }
        ...
        {
          height: '100px',
          height: '75%', // Please read info note below
          height: 100 // For backward compatibility we parse number into pixels
        }

    These dimensions will be set as inline styles in a container element and `overflow: hidden` will be added automatically.

    If container is a block element, then its parent has to have defined `height`. By default block element is `0px` height, so `100%` from `0px` is still `0px`.

    Changes called in `updateSettings` will rerender grid with the new properties

### What if dimensions are not set up

If you don't define dimensions, Handsontable will generate as many rows and columns to fill available space and will also provide full support for virtual rendering and fixed parts.

You might come across performance issues when editing or scrolling, because of the entirely different positioning algorithm for fixed areas.

### Autoresizing

Since `v7.0.0` we observe window resizing. If the window's dimensions have changed then we check if Handsontable should resize itself too. Due to the performance issue, we use debounce method to response on window resize.

You can easily overwrite this behaviour by returning `false` in `beforeRefreshDimensions` hook.

    {
      beforeRefreshDimensions() { return false; }
    }

### Manual resizing

Created Handsontable instance exposes `refreshDimensions()` method which helps to resize grid elements properly.

    const hot = new Handsontable(...);
    hot.refreshDimensions();

Additionally, you can listen for two hooks, `beforeRefreshDimensions` and `afterRefreshDimensions`.

Expand container

Edit

.graybox { padding: 15px; background: #f8f8f8; height: 400px; } .slice { height: 50%; width: 50%; transition: all 0.5s; background: #f0f0f0; overflow: hidden; } .graybox.expanded .slice { height: 100%; width: 100%; } var sliceElem = document.querySelector('.slice'); var blueboxElem = sliceElem.parentElement; var triggerBtn = document.getElementById('expander'); var example = document.getElementById('example'); var hot = new Handsontable(example, { data: Handsontable.helper.createSpreadsheetData(50, 50), rowHeaders: true, colHeaders: true, width: '100%', height: '100%', rowHeights: 30, colWidths: 100, }); triggerBtn.addEventListener('click', function() { if (triggerBtn.textContent === 'Collapse') { triggerBtn.textContent = 'Expand'; blueboxElem.className = blueboxElem.className.replace(' expanded', ''); } else { triggerBtn.textContent = 'Collapse'; blueboxElem.className += ' expanded' } }); sliceElem.addEventListener('transitionend', function(e) { if (e.propertyName === 'width') { hot.refreshDimensions(); } });
