---
id: 95c84eb4
title: Star Rating
metaTitle: Star Rating Cell Type - React Data Grid | Handsontable
description: Learn how to create a custom Handsontable cell type using a star rating component for selecting numeric ratings directly in your data grid.
permalink: /recipes/cell-types/react-rating
canonicalUrl: /recipes/cell-types/react-rating
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 4848b7eb
  metaTitle: Star Rating Cell Type - React Data Grid | Handsontable
angular:
  id: 3a4f760c
  metaTitle: Star Rating Cell Type - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
---

# Star Rating Cell Type - Step-by-Step Guide (React)

[[toc]]

## Overview

This guide shows how to create a star rating editor cell using `react-star-rating-component` with React's `EditorComponent`. Perfect for product reviews, feedback forms, or any scenario where users need to select a numeric rating (e.g., 1–5 stars).

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** react-star-rating-component

## What You'll Build

A cell that:
- Displays interactive star rating when editing
- Shows the selected rating when viewing
- Supports hover preview before selection
- Stores values as numbers (1–5)
- Provides click-to-select functionality
- Works with React's component-based architecture

## Complete Example

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/cell-types/react-rating/react/example1.css)
@[code](@/content/recipes/cell-types/react-rating/react/example1.jsx)
@[code](@/content/recipes/cell-types/react-rating/react/example1.tsx)

:::

:::

## Prerequisites

```bash
npm install @handsontable/react-wrapper react-star-rating-component
```

**What you need:**
- React 16.8+ (hooks support)
- `@handsontable/react-wrapper` package
- `react-star-rating-component` package for the star rating UI
- Basic React knowledge (hooks, JSX)

## Step 1: Import Dependencies

```tsx
import { HotTable, HotColumn, EditorComponent } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import StarRatingComponent from 'react-star-rating-component';

registerAllModules();
```

**What we're importing:**
- `EditorComponent` - React component for creating custom editors
- `HotTable` and `HotColumn` - React wrapper components
- `StarRatingComponent` - Star rating UI from react-star-rating-component
- Handsontable styles

## Step 2: Create the Editor Component

Create a React component that uses `EditorComponent` with the render prop pattern.

```tsx
export const RatingEditor = () => {
  return (
    <div className="rating-editor">
      <EditorComponent<number>>
        {({ value, setValue, finishEditing }) => (
          <StarRatingComponent
            name="rating"
            value={Number(value) || 0}
            onStarHover={(nextValue) => setValue(nextValue)}
            onStarClick={(nextValue) => {
              setValue(nextValue);
              finishEditing();
            }}
          />
        )}
      </EditorComponent>
    </div>
  );
};
```

**What's happening:**
1. `EditorComponent` wraps your editor UI
2. The `children` prop is a function that receives editor state
3. `value` - Current cell value (numeric rating)
4. `setValue` - Function to update the value
5. `finishEditing` - Function to save and close the editor
6. `onStarHover` - Updates preview as user hovers over stars
7. `onStarClick` - Saves the selected rating and closes the editor

**Key concepts:**
- **Render prop pattern**: `EditorComponent` uses a function as children
- **Hover preview**: `onStarHover` lets users preview before committing
- **Click to confirm**: `onStarClick` saves and closes (similar to feedback buttons)

## Step 3: Add Styling

Style the editor container to fit within the cell.

```css
.rating-editor > div {
  box-sizing: border-box;
  padding: 3px !important;
  border: 1px solid #e7e7e9 !important;
  margin-left: 1px;
}
```

**What's happening:**
- Targets the inner div rendered by `EditorComponent`
- Adds padding and border for visual separation
- `!important` may be needed to override Handsontable's default styles

## Step 4: Prepare Sample Data

Create data with numeric rating values for the rating column.

```tsx
const inputData = new Array(10)
  .fill(null)
  .map((_, row) =>
    new Array(10)
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

export const data = inputData.map((el) => ({
  ...el,
  rating: Math.floor(Math.random() * 5) + 1,
}));
```

**What's happening:**
- Generates a 10×10 grid with random ratings 1–5
- Each row has a `rating` property (number)

## Step 5: Use in Handsontable

Use the editor component in your `HotTable`:

```tsx
const ExampleComponent = () => {
  return (
    <HotTable
      autoRowSize={true}
      rowHeaders={true}
      autoWrapRow={true}
      licenseKey="non-commercial-and-evaluation"
      height="auto"
      themeName="ht-theme-main"
      data={data}
      colHeaders={true}
    >
      <HotColumn
        width={250}
        editor={RatingEditor}
        data="rating"
        title="Rating"
      />
    </HotTable>
  );
};
```

**What's happening:**
- `editor={RatingEditor}` - Assigns the star rating editor to the column
- `data="rating"` - Binds to the rating property in each row
- Column displays numeric values; double-click opens the star picker

**Key features:**
- Intuitive star-based selection
- Values stored as numbers (1–5)
- Type-safe with TypeScript

## How It Works - Complete Flow

1. **Initial Render**: Cell displays the numeric rating (e.g., `3`)
2. **User Double-Clicks or Enter**: Editor opens
3. **Editor Opens**: `EditorComponent` positions container over cell
4. **Star Rating Display**: Stars show current value, empty stars show remaining
5. **User Interaction**:
   - Hover over stars → `onStarHover` updates preview via `setValue`
   - Click a star → `onStarClick` saves value and calls `finishEditing()`
6. **Save**: Numeric value saved to cell
7. **Editor Closes**: Cell shows the rating number

## Enhancements

### 1. Custom Star Count

Change the number of stars (e.g., 10-point scale):

```tsx
<StarRatingComponent
  name="rating"
  starCount={10}
  value={Number(value) || 0}
  onStarHover={(nextValue) => setValue(nextValue)}
  onStarClick={(nextValue) => {
    setValue(nextValue);
    finishEditing();
  }}
/>
```

### 2. Custom Star Colors

Customize the appearance:

```tsx
<StarRatingComponent
  name="rating"
  value={Number(value) || 0}
  starColor="#ffd700"
  emptyStarColor="#e0e0e0"
  onStarHover={(nextValue) => setValue(nextValue)}
  onStarClick={(nextValue) => {
    setValue(nextValue);
    finishEditing();
  }}
/>
```

### 3. Custom Renderer for Star Display

Add a custom renderer to show stars in view mode:

```tsx
import { rendererFactory } from 'handsontable/renderers';

const starRenderer = rendererFactory(({ td, value }) => {
  const rating = Number(value) || 0;
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  td.innerHTML = `
    <div style="
      font-size: 1.2em;
      color: #ffb400;
      letter-spacing: 2px;
    ">${stars}</div>
  `;
});

// Use in HotColumn
<HotColumn
  width={250}
  editor={RatingEditor}
  renderer={starRenderer}
  data="rating"
  title="Rating"
/>
```

### 4. Read Config from Cell Properties

Use `onPrepare` for per-column configuration (e.g., star count):

```tsx
const RatingEditor = () => {
  const [starCount, setStarCount] = useState(5);

  const onPrepare = (_row, _column, _prop, _TD, _originalValue, cellProperties) => {
    if (cellProperties.starCount != null) {
      setStarCount(cellProperties.starCount);
    }
  };

  return (
    <div className="rating-editor">
      <EditorComponent<number> onPrepare={onPrepare}>
        {({ value, setValue, finishEditing }) => (
          <StarRatingComponent
            name="rating"
            starCount={starCount}
            value={Number(value) || 0}
            onStarHover={(nextValue) => setValue(nextValue)}
            onStarClick={(nextValue) => {
              setValue(nextValue);
              finishEditing();
            }}
          />
        )}
      </EditorComponent>
    </div>
  );
};

// Use with different star counts per column
<HotColumn editor={RatingEditor} starCount={5} data="rating" title="Rating (1-5)" />
<HotColumn editor={RatingEditor} starCount={10} data="score" title="Score (1-10)" />
```

### 5. Handle Empty Values

Ensure the component handles undefined or null:

```tsx
value={Number(value) || 0}
```

This displays empty stars when the cell has no value.

## Accessibility

The `StarRatingComponent` uses radio inputs. Enhance with ARIA:

```tsx
<StarRatingComponent
  name="rating"
  value={Number(value) || 0}
  onStarHover={(nextValue) => setValue(nextValue)}
  onStarClick={(nextValue) => {
    setValue(nextValue);
    finishEditing();
  }}
  aria-label="Select rating"
/>
```

**Keyboard navigation:**
- **Tab**: Navigate to editor
- **Arrow keys**: Navigate between stars (if supported by library)
- **Enter/Space**: Select star
- **Escape**: Cancel editing

## Performance Considerations

### Why This Is Fast

1. **Lightweight library**: react-star-rating-component is small and focused
2. **React Virtual DOM**: Efficient updates only when value changes
3. **Simple callbacks**: `onStarHover` and `onStarClick` are straightforward
4. **No unnecessary re-renders**: Editor unmounts when closed

## TypeScript Support

`EditorComponent` is fully typed. Specify the value type for numeric ratings:

```tsx
<EditorComponent<number>>
  {({ value, setValue, finishEditing }) => {
    // TypeScript knows value is number | undefined
    // TypeScript knows setValue accepts number
    return (
      <StarRatingComponent
        name="rating"
        value={Number(value) || 0}
        onStarHover={(nextValue: number) => setValue(nextValue)}
        onStarClick={(nextValue: number) => {
          setValue(nextValue);
          finishEditing();
        }}
      />
    );
  }}
</EditorComponent>
```

## Best Practices

1. **Coerce value to number** - Use `Number(value) || 0` since cell values may be strings
2. **Provide `name` prop** - Required by react-star-rating-component for radio inputs
3. **Call `finishEditing()` on click** - Star click confirms the selection
4. **Use `onStarHover` for preview** - Improves UX by showing selection before commit
5. **Consider custom renderer** - Display stars in view mode for consistency

---

**Congratulations!** You've created a star rating editor using React's `EditorComponent` and `react-star-rating-component`, perfect for rating selection in your data grid!
