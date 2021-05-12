---
title: Using the HotColumn component
metaTitle: Using the HotColumn component - Guide - Handsontable Documentation
permalink: /next/react-hot-column
canonicalUrl: /react-hot-column
---

# Using the HotColumn component

[[toc]]

It allows to configure the column-related settings using the `HotColumn` component's attributes. It also creates custom renderers and editors using React components.

## Declaring column settings

To declare column-specific settings, simply pass the settings as `HotColumn` props, either separately or wrapped as a `settings` prop, exactly as you would with `HotTable`.

<iframe src="https://codesandbox.io/embed/declaring-column-settings-hknvq?fontsize=14" title="Declaring column settings" allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb" 
  style="width: 100%;
  height: 390px;
  border: 0;
  borderRadius: 4;
  overflow: hidden;" 
  sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

## Declaring a custom renderer as a component

The wrapper allows creating custom renderers using React components.
Although it's possible to use class-based react components for this purpose, **we strongly suggest** using functional components, as the `state` of a class-based component would re-initialize on every Handsontable render.

To mark a component as a Handsontable renderer, simply add a `hot-renderer` attribute to it.

::: tip
Because the Handsontable's `autoRowSize` and `autoColumnSize` options require calculating the widths/heights of some of the cells before rendering them into the table, it's not currently possible to use them alongside component-based renderers, as they're created after the table's initialization.

Be sure to turn those options off in your Handsontable config, as keeping them enabled may cause unexpected results. Please note that `autoColumnSize` is enabled by default.
:::

<iframe src="https://codesandbox.io/embed/declaring-column-settings-hexfj?fontsize=14" title="Declaring a custom renderer as a component" allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb" 
  style="width: 100%;
  height: 390px;
  border: 0;
  borderRadius: 4;
  overflow: hidden;"
  sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

## Object data source

When you use object data binding for `HotColumn` you need to provide precise information about the data structure for columns. To do so, refer to the data for a column in props as `data`, for example, `<HotColumn data="id" />`.

<iframe src="https://codesandbox.io/embed/object-data-source-b9799?fontsize=14&hidenavigation=1&theme=dark" 
  style="width: 100%;
  height: 390px;
  border: 0;
  borderRadius: 4;
  overflow: hidden;" 
  title="Object data source" 
  allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb" 
  sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

## Declaring a custom editor as a component

You can also utilize the React components to create custom editors. To do so, you'll need to create a component compatible with Handsontable's editor class structure. The easiest way to do so is to extend `BaseEditorComponent` - a base editor component exported from `@handsontable/react`.

This will give you a solid base to build upon. Note, that the editor component needs to tick all of the boxes that a regular editor does, such as defining the `getValue`, `setValue`, `open`, `close` and `focus` methods, which are abstract in the `BaseEditor`. For more info, check the documentation on [creating custom editors from scratch](cell-editor.md#-selecteditor-creating-editor-from-scratch).

It's also worth noting, that editors in Handsontable will close after clicking on them if the `outsideClickDeselects` option is enabled (and it is by default).
To prevent that, `mousedown` event on the editor container must call `event.stopPropagation()`. In React's case, however, it doesn't work out-of-the-box, because of the way React handles events ([this article by Eric Clemmons](https://medium.com/@ericclemmons/react-event-preventdefault-78c28c950e46) sums it up pretty well). In the example below, we're using the [react-native-listener](https://www.npmjs.com/package/react-native-listener) library, to utilize the native `mousedown` event.

<iframe src="https://codesandbox.io/embed/declaring-a-custom-editor-as-a-component-s1i0k?fontsize=14" 
  style="width: 100%;
  height: 390px;
  border: 0;
  borderRadius: 4;
  overflow: hidden;"
  title="Declaring a custom editor as a component" 
  allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb" 
  sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

## Using the renderer/editor components with React's Context

It this example we're using React's Context to pass the information available in the main app component all the way to the renderer. In this case we're using just the renderer, but the same principle works with editors just as well.

<iframe src="https://codesandbox.io/embed/using-the-renderer-component-with-reacts-context-m1x09?fontsize=14" 
  style="width: 100%;
  height: 390px;
  border: 0;
  borderRadius: 4;
  overflow: hidden;"
  title="Using the renderer component with React&#039;s Context" 
  allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb" 
  sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

## An advanced example

In this example we create a custom editor component with an external dependency, which acts as both renderer and editor. Information from that component is used by the renderer in the first column to change the way it behaves.
The information is passed using Redux and `react-redux`'s `connect` method.

<iframe src="https://codesandbox.io/embed/advanced-handsontablereact-implementation-using-hotcolumn-878mz?fontsize=14" 
  style="width: 100%;
  height: 390px;
  border: 0;
  borderRadius: 4;
  overflow: hidden;"
  title="Advanced @handsontable/react implementation using HotColumn" 
  allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb" 
  sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>
