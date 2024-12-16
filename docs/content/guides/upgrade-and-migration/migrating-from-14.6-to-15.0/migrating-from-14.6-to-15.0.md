---
id: migrating-14.6-to-15.0
title: Migrating from 14.6 to 15.0
metaTitle: Migrating from 14.6 to 15.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 14.6 to Handsontable 15.0, released on [].
permalink: /migration-from-14.6-to-15.0
canonicalUrl: /migration-from-14.6-to-15.0
pageClass: migration-guide
react:
  id: migrating-14.6-to-15.0-react
  metaTitle: Migrate from 14.6 to 15.0 - React Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrate from 14.6 to 15.0

Migrate from Handsontable 14.6 to Handsontable 15.0, released on December 16th, 2024.

[[toc]]

## Introducing the New React Wrapper

With Handsontable 15.0, we're rolling out a brand-new React wrapper designed for functional programming. It focuses on type safety, idiomatic React usage, and developer experience. Named `react-wrapper`, you can find it in our [GitHub monorepo](https://github.com/handsontable/handsontable/tree/master/wrappers/react-wrapper) or install it directly from [npm](https://www.npmjs.com/package/@handsontable/react-wrapper).

This guide will help you migrate your existing `@handsontable/react` class-based wrapper to `@handsontable/react-wrapper`.

### Key changes
- Removal of the `settings` prop in favor of direct prop passing
- Updated syntax for defining custom renderers and editors
- Introduction of the `useHotEditor` hook for creating function-based custom editors

::: tip
The class-based `@handsontable/react` wrapper is still around and fully supported. So if you're into class-based editor and renderer components, you can keep using it.
:::

## Warning messages

To assist you in the migration process, `@handsontable/react-wrapper` provides warning messages to help identify and update deprecated practices:

```txt
Obsolete Renderer Warning:
Providing a component-based renderer using `hot-renderer`-annotated component is no longer supported. 
Pass your component using `renderer` prop of the `HotTable` or `HotColumn` component instead.

Obsolete Editor Warning:
Providing a component-based editor using `hot-editor`-annotated component is no longer supported. 
Pass your component using `editor` prop of the `HotTable` or `HotColumn` component instead.
```

## Migration steps

### 1. Removal of `settings` property

The `settings` property has been removed. Configuration options must now be passed directly to the `HotTable` component.

**`@handsontable/react`:**
```jsx
const settings = { rowHeaders: true, colHeaders: true };

<HotTable settings={settings} />
```

**`@handsontable/react-wrapper`:**
```jsx
<HotTable 
  rowHeaders={true} 
  colHeaders={true}
  // Other options are available as props
/>
```

### 2. Custom renderer changes

Custom renderers should now be provided using the `renderer` prop of either HotTable or HotColumn.

**`@handsontable/react`:**
```jsx
<HotColumn width={250}>
  <RendererComponent hot-renderer />
</HotColumn>
```

**`@handsontable/react-wrapper`:**
```jsx
<HotColumn width={250} renderer={RendererComponent} />
```

Additionally, custom renderers now receive props with proper TypeScript definitions:

```tsx
import { HotRendererProps } from '@handsontable/react-wrapper';

const MyRenderer = (props: HotRendererProps) => {
  const { value, row, col, cellProperties } = props;
  return (
    <div style={{ backgroundColor: cellProperties.readOnly ? '#f0f0f0' : '#fff' }}>
      {`${value.name}: ${value.value} at (${row}, ${col})`}
    </div>
  );
};
```

::: tip
If you’re using the `renderer` option for JavaScript function-based renderers, don’t worry - you can still use them! Just define them under the `hotRenderer` key instead of `renderer`.
:::

### 3. Custom editor changes

Custom editors have changed a lot - they've moved from class-based to function-based components, now using the new `useHotEditor` hook.

#### 3.1. Replace the class declaration with a function:
**`@handsontable/react`:**
```jsx
class EditorComponent extends BaseEditorComponent {
  // ...
}
```

**`@handsontable/react-wrapper`:**
```
const EditorComponent = () => {
  // ...
};
```

#### 3.2. Implement the `useHotEditor` hook
Replace the `BaseEditorComponent` methods with the `useHotEditor` hook:
```jsx
import { useHotEditor } from '@handsontable/react-wrapper';

const EditorComponent = () => {
  const { value, setValue, finishEditing } = useHotEditor({
    onOpen: () => {
      // Open logic
    },
    onClose: () => {
      // Close logic
    },
  });

  // Component logic here
};
```

#### 3.3. Update the component structure
Replace the `render` method with the function component's return statement:
```jsx
return (
  <div>
    <button onClick={finishEditing}>Apply</button>
  </div>
);
```

#### 3.4. Update HotColumn Usage
Just like with renderers, custom editors now need to be provided using the `editor` prop on either `HotTable` or `HotColumn`.

**`@handsontable/react`:**
```jsx
<HotColumn width={250}>
  <EditorComponent hot-editor />
</HotColumn>
```
**`@handsontable/react-wrapper`:**
```jsx
<HotColumn width={250} editor={EditorComponent} />
```

::: tip  
If you’re using the `editor` option for JavaScript class-based editors, you can still use them. Just define them under the `hotEditor` key instead of `editor`.  
:::
