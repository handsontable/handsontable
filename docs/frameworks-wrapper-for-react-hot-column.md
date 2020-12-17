---
id: frameworks-wrapper-for-react-hot-column
title: Using the HotColumn component
sidebar_label: Using the HotColumn component
slug: /frameworks-wrapper-for-react-hot-column
---

#### Version `3.1.0` of the `@handsontable/react` wrapper introduces a new feature - a `HotColumn` component.

It doesn't only allow to configure the column-related settings using the `HotColumn` component's attributes, but also create custom renderers and editors using React components.

*   [Declaring column settings](#column-settings)
*   [Declaring a custom renderer as a component](#custom-renderer)
*   [Object data source](#object-data-source)
*   [Declaring a custom editor as a component](#custom-editor)
*   [Using the renderer/editor components with React's Context](#context)
*   [A more advanced example](#advanced-example)

### Declaring column settings

To declare column-specific settings, simply pass the settings as `HotColumn` props (either separately or wrapped as a `settings` prop, exactly as you would with `HotTable`).

### Declaring a custom renderer as a component

The wrapper allows creating custom renderers using React components.  
Although it's possible to use class-based react components for this purpose, **we strongly suggest** using functional components, as the `state` of a class-based component would re-initialize on every Handsontable render.

To mark a component as a Handsontable renderer, simply add a `hot-renderer` attribute to it.

Because the Handsontable's `autoRowSize` and `autoColumnSize` options require calculating the widths/heights of some of the cells before rendering them into the table, it's not currently possible to use them alongside component-based renderers, as they're created after the table's initialization.  
**Be sure to turn those options off in your Handsontable config, as keeping them enabled may cause unexpected results (note that `autoColumnSize` is enabled by default).**

### Object data source

When you use object data binding for `HotColumn` you need to provide precise information about the data structure for columns. To do so, refer to the data for a column in props as `data`, for example, `<HotColumn data="id" />` .

You can read more on this topic on the [data source page](https://handsontable.com/docs/tutorial-data-sources.html#page-object.html).

### Declaring a custom editor as a component

You can also utilize the React components to create custom editors. To do so, you'll need to create a component compatible with Handsontable's editor class structure. The easiest way to do so is to extend `BaseEditorComponent` - a base editor component exported from `@handsontable/react`.

This will give you a solid base to build upon. Note, that the editor component needs to tick all of the boxes that a regular editor does, such as defining the `getValue`, `setValue`, `open`, `close` and `focus` methods, which are abstract in the `BaseEditor`. For more info, check the documentation on [creating custom editors from scratch](https://handsontable.com/docs/tutorial-cell-editor.html#-selecteditor-creating-editor-from-scratch).

It's also worth noting, that editors in Handsontable will close after clicking on them if the `outsideClickDeselects` option is enabled (and it is by default).  
To prevent that, `mousedown` event on the editor container must call `event.stopPropagation()`. In React's case, however, it doesn't work out-of-the-box, because of the way React handles events ([this article by Eric Clemmons](https://medium.com/@ericclemmons/react-event-preventdefault-78c28c950e46) sums it up pretty well). In the example below, we're using the [react-native-listener](https://www.npmjs.com/package/react-native-listener) library, to utilize the native `mousedown` event.

### Using the renderer/editor components with React's Context

It this example we're using React's Context to pass the information available in the main app component all the way to the renderer. In this case we're using just the renderer, but the same principle works with editors just as well.

### A more advanced example

In this example we will create a custom editor component with an external dependency, which will act as both renderer and editor. Information from that component will be used by another component (first column renderer) to change the way it behaves.  
The information will be passed using Redux and `react-redux`'s `connect` method.
