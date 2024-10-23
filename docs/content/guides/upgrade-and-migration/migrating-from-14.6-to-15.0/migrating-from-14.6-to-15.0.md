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

Migrate from Handsontable 14.6 to Handsontable 15.0, released on [...].

[[toc]]

### Changes to the React wrappers.

Handsontable 15.0 introduces significant improvements to its React wrapper, focusing on type safety, idiomatic React usage, and developer experience.
That's why we're introducing a new React wrapper under the name of `@handsontable/react-wrapper`.

This guide will help you migrate your existing `@handsontable/react` components to `@handsontable/react-wrapper`.

##### Key Changes
- Removal of the `settings` prop in favor of direct prop passing
- Updated syntax for defining custom renderers and editors
- Introduction of the `useHotEditor` hook for creating function-based custom editors

::: tip
It's worth noting, that `@handsontable/react` remains available if you prefer to keep using class-based editor and renderer components.
:::

## Warning Messages

To assist you in the migration process, `@handsontable/react-wrapper` provides warning messages to help identify and update deprecated practices:

```txt
Obsolete Renderer Warning:
Providing a component-based renderer using `hot-renderer`-annotated component is no longer supported. 
Pass your component using `renderer` prop of the `HotTable` or `HotColumn` component instead.

Obsolete Editor Warning:
Providing a component-based editor using `hot-editor`-annotated component is no longer supported. 
Pass your component using `editor` prop of the `HotTable` or `HotColumn` component instead.
```

### Migration steps

#### 1. Removal of `settings` property

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
  // All other Handsontable options are available as props
/>
```

#### 2. Custom renderer changes

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
If you're currently utilizing the `renderer` option to provide javascript function-based renderers, you can still use them. Instead of defining them under the `renderer` key, do it under `hotRenderer`.
:::

#### 3. Custom editor changes

Custom editors have undergone significant changes, transitioning from class-based to function-based components using the new `useHotEditor` hook.

##### 3.1. Replace the class declaration with a function:
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

##### 3.2. Implement the `useHotEditor` hook
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

##### 3.3. Update the component structure
Replace the `render` method with the function component's return statement:
```jsx
return (
  <div>
    <button onClick={finishEditing}>Apply</button>
  </div>
);
```

##### 3.4. Update HotColumn usage
Similar to renderers, custom editors should now be provided using the `editor` prop of either `HotTable` or `HotColumn`.

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
If you're currently utilizing the `editor` option to provide javascript class-based editors, you can still use them. Instead of defining them under the `editor` key, do it under `hotEditor`.
:::
