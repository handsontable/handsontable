---
type: how-to
id: 95c84eb4
title: Star Rating
metaTitle: Star Rating Cell Type - React Data Grid | Handsontable
description: Learn how to create a custom Handsontable cell type using a star rating component for selecting numeric ratings directly in your data grid.
permalink: /recipes/cell-types/react-rating
canonicalUrl: /recipes/cell-types/react-rating
framework: react
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
vue:
  id: cmt6617x
searchCategory: Recipes
category: Cell Types
---

This tutorial shows you how to build a star rating cell in React using Handsontable's `EditorComponent`, a custom renderer, and a local React component for the stars.

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/cell-types/react-rating/react/example1.css)
@[code](@/content/recipes/cell-types/react-rating/react/example1.jsx)
@[code](@/content/recipes/cell-types/react-rating/react/example1.tsx)

:::

:::

## Overview

This guide shows how to create a star rating editor cell using React's `EditorComponent`. Use this pattern for product reviews, feedback forms, or any scenario where users select a numeric rating, such as 1-5 stars.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** No external rating library.

## What You'll Build

A cell that:
- Displays interactive star rating when editing
- Shows stars in view mode via a custom React renderer
- Supports hover preview before selection
- Stores values as numbers (1-5)
- Validates rating range, such as 0-100
- Provides click-to-select functionality
- Works with React's component-based architecture

## Prerequisites

```bash
npm install handsontable @handsontable/react-wrapper
```

**What you need:**
- React 16.8+ (hooks support)
- `@handsontable/react-wrapper` package
- Basic React knowledge (hooks, JSX)

## Step 1: Import Dependencies

```tsx
import { HotTable, HotColumn, EditorComponent } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

**What we're importing:**
- `EditorComponent` - React component for creating custom editors
- `HotTable` and `HotColumn` - React wrapper components
- `registerAllModules()` - Registers Handsontable modules (required when using the wrapper)

## Step 2: Create the Star Rating Component

Create a local component that renders five stars and reports hover and click events.

```tsx
interface StarRatingProps {
  name: string;
  value: number;
  editing?: boolean;
  onStarHover?: (value: number) => void;
  onStarClick?: (value: number) => void;
}

function StarRating({ name, value, editing = true, onStarHover, onStarClick }: StarRatingProps) {
  return (
    <div className="star-rating" aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={`${name}-${star}`}
          className={star <= value ? 'star filled' : 'star'}
          onMouseEnter={editing ? () => onStarHover?.(star) : undefined}
          onClick={editing ? () => onStarClick?.(star) : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
}
```

**What's happening:**
- The `name` prop creates stable keys for each star.
- The `editing` prop disables hover and click handlers in view mode.
- `onStarHover` previews the value before the user commits it.
- `onStarClick` commits the selected value.

## Step 3: Create the Editor Component

Create a React component that uses `EditorComponent` with the render prop pattern.

```tsx
export const RatingEditor = () => {
  return (
    <EditorComponent<number>>
      {({ value, setValue, finishEditing }) => (
        <div className="rating-editor">
          <StarRating
            name="rating"
            value={Number(value) || 0}
            onStarHover={(nextValue) => setValue(nextValue)}
            onStarClick={(nextValue) => {
              setValue(nextValue);
              finishEditing();
            }}
          />
        </div>
      )}
    </EditorComponent>
  );
};
```

**What's happening:**
1. `EditorComponent` wraps your editor UI; the `children` prop is a function that receives editor state.
2. `value` - Current cell value (numeric rating)
3. `setValue` - Function to update the value
4. `finishEditing` - Function to save and close the editor
5. `StarRating` - Renders the local star picker
6. `onStarHover` - Updates preview as the user hovers over stars
7. `onStarClick` - Saves the selected rating and closes the editor
8. The `rating-editor` div is inside the render prop so styling applies to the visible editor area.

**Key concepts:**
- **Render prop pattern**: `EditorComponent` uses a function as children
- **Hover preview**: `onStarHover` lets users preview before committing
- **Click to confirm**: `onStarClick` saves and closes the editor

## Step 4: Add a Custom Renderer for View Mode

Use a React component as the cell renderer so stars are shown when not editing.

```tsx
const RatingCellRenderer = ({ value }: { value: unknown }) => (
  <div className="rating-cell">
    <StarRating
      name="rating-cell"
      value={Number(value) || 0}
      editing={false}
    />
  </div>
);
```

**What's happening:**
- The renderer receives `value` and displays it with `StarRating`
- `editing={false}` keeps the stars non-interactive in view mode
- Use a unique `name` (for example, `"rating-cell"`) to keep stable React keys for the renderer

## Step 5: Add a Validator (Optional)

Validate that the rating is within an allowed range, such as 0-100:

```tsx
const ratingValidator = (value: string | number, callback: (valid: boolean) => void) => {
  const parsed = parseInt(String(value));
  callback(parsed >= 0 && parsed <= 100);
};
```

For a strict 1-5 star scale, use `parsed >= 1 && parsed <= 5` instead.

## Step 6: Add Styling

Style the cell and editor so the star rating fits and matches the grid.

```css
.star-rating {
  display: inline-flex;
  gap: 1px;
}

.star-rating .star {
  font-size: 18px;
  color: #d3d3d3;
  line-height: 1;
  cursor: default;
  user-select: none;
  transition: color 0.1s;
}

.rating-editor .star-rating .star {
  cursor: pointer;
}

.star-rating .star.filled {
  color: #ffb400;
}

.rating-cell {
  display: flex;
  align-items: center;
  margin: 3px 0 0 -1px;
}

.rating-editor {
  display: flex;
  align-items: center;
  height: 100%;
  box-sizing: border-box !important;
  border: none;
  border-radius: 0;
  box-shadow: inset 0 0 0 var(--ht-cell-editor-border-width, 2px)
    var(--ht-cell-editor-border-color, #1a42e8),
    0 0 var(--ht-cell-editor-shadow-blur-radius, 0) 0
    var(--ht-cell-editor-shadow-color, transparent);
  background-color: var(--ht-cell-editor-background-color, #ffffff);
  padding: var(--ht-cell-vertical-padding, 4px)
    var(--ht-cell-horizontal-padding, 8px);
  font-family: var(--ht-font-family, inherit);
  font-size: var(--ht-font-size, 14px);
  line-height: var(--ht-line-height, 1.5);
}
```

**What's happening:**
- `.star-rating` lays out the local star component
- `.star-rating .star.filled` colors the selected stars
- `.rating-cell` aligns the stars in the cell when not editing
- `.rating-editor` uses Handsontable CSS variables for focus border, background, and padding so the editor matches the grid theme

## Step 7: Prepare Sample Data

Use data with a `rating` property (and any other columns you need). Example for a product table:

```tsx
export const data = [
  { product: "Dashboard Pro", category: "Analytics", rating: 5, reviews: 342, price: 49 },
  { product: "Form Builder", category: "Tools", rating: 4, reviews: 218, price: 29 },
  { product: "Chart Engine", category: "Analytics", rating: 3, reviews: 156, price: 39 },
  { product: "Auth Module", category: "Security", rating: 5, reviews: 89, price: 19 },
  { product: "File Manager", category: "Storage", rating: 2, reviews: 64, price: 15 },
  { product: "Email Service", category: "Communication", rating: 4, reviews: 275, price: 25 },
  { product: "Search Index", category: "Tools", rating: 1, reviews: 31, price: 35 },
  { product: "Cache Layer", category: "Infra", rating: 4, reviews: 112, price: 20 },
];
```

**What's happening:**
- Each row has `product`, `category`, `rating`, `reviews`, and `price`
- The `rating` column uses the star editor and renderer; other columns can be text or numeric

## Step 8: Use in Handsontable

Wire the editor, renderer, and validator to the rating column:

```tsx
const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={["Product", "Category", "Rating", "Reviews", "Price"]}
      autoRowSize={true}
      rowHeaders={true}
      height="auto"
      width="100%"
      autoWrapRow={true}
      headerClassName="htLeft"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="product" type="text" width={240} />
      <HotColumn data="category" type="text" width={120} />
      <HotColumn
        data="rating"
        width={150}
        editor={RatingEditor}
        renderer={RatingCellRenderer}
        validator={ratingValidator}
      />
      <HotColumn data="reviews" type="numeric" width={80} />
      <HotColumn data="price" type="numeric" width={80} />
    </HotTable>
  );
};
```

**What's happening:**
- `editor={RatingEditor}` - Star rating editor when the cell is active
- `renderer={RatingCellRenderer}` - Shows stars in view mode
- `validator={ratingValidator}` - Ensures rating is within the allowed range, such as 0-100
- `data="rating"` - Binds to the `rating` property in each row

**Key features:**
- Stars in both view and edit mode
- Values stored as numbers (1-5)
- Validation and type-safe setup with TypeScript

## How It Works - Complete Flow

1. **Initial Render**: `RatingCellRenderer` displays stars for the current rating, such as 3 filled stars.
2. **User Double-Clicks or Enter**: Editor opens.
3. **Editor Opens**: `EditorComponent` shows the star picker in the cell.
4. **Star Rating Display**: `StarRating` shows the current value; empty stars show the remaining scale.
5. **User Interaction**:
   - Hover over stars → `onStarHover` updates preview via `setValue`
   - Click a star → `onStarClick` saves value and calls `finishEditing()`
6. **Validation**: `ratingValidator` runs, such as checking that the value is 0-100.
7. **Save**: Numeric value is saved to the cell.
8. **Editor Closes**: `RatingCellRenderer` shows the updated stars in view mode.

## Enhancements

### 1. Custom Star Count

Change the number of stars, such as a 10-point scale:

```tsx
interface StarRatingProps {
  name: string;
  value: number;
  starCount?: number;
  editing?: boolean;
  onStarHover?: (value: number) => void;
  onStarClick?: (value: number) => void;
}

function StarRating({ name, value, starCount = 5, editing = true, onStarHover, onStarClick }: StarRatingProps) {
  const stars = Array.from({ length: starCount }, (_, index) => index + 1);

  return (
    <div className="star-rating" aria-label={`Rating: ${value} out of ${starCount}`}>
      {stars.map((star) => (
        <span
          key={`${name}-${star}`}
          className={star <= value ? 'star filled' : 'star'}
          onMouseEnter={editing ? () => onStarHover?.(star) : undefined}
          onClick={editing ? () => onStarClick?.(star) : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
}
```

### 2. Custom Star Colors

Customize the appearance:

```css
.star-rating .star {
  color: #e0e0e0;
}

.star-rating .star.filled {
  color: #ffd700;
}
```

### 3. Alternative: HTML-Based Renderer

The main example uses a React component (`RatingCellRenderer`) for view mode. If you prefer a non-React renderer, you can use `rendererFactory`:

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
  data="rating"
  width={150}
  editor={RatingEditor}
  renderer={starRenderer}
/>
```

### 4. Read Config from Cell Properties (Advanced)

Use `onPrepare` for per-column configuration, such as star count:

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
          <StarRating
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

The local `StarRating` component sets `aria-label` on the rating container. To add keyboard support, render each star as a button:

```tsx
<button
  type="button"
  className={star <= value ? 'star filled' : 'star'}
  onMouseEnter={editing ? () => onStarHover?.(star) : undefined}
  onClick={editing ? () => onStarClick?.(star) : undefined}
  aria-label={`Set rating to ${star}`}
>
  ★
</button>
```

**Keyboard navigation:**
- **Tab**: Navigate to editor
- **Arrow keys**: Navigate between stars after you add key handlers
- **Enter/Space**: Select star
- **Escape**: Cancel editing

## Performance Considerations

### Why This Is Fast

1. **No external rating package**: The star UI uses a small local component.
2. **React Virtual DOM**: Updates happen only when the value changes.
3. **Focused callbacks**: `onStarHover` and `onStarClick` each do one thing.
4. **No unnecessary re-renders**: The editor unmounts when closed.

## TypeScript Support

`EditorComponent` is fully typed. Specify the value type for numeric ratings:

```tsx
<EditorComponent<number>>
  {({ value, setValue, finishEditing }) => {
    // TypeScript knows value is number | undefined
    // TypeScript knows setValue accepts number
    return (
      <StarRating
        name="rating"
        value={Number(value) || 0}
        onStarHover={(nextValue) => setValue(nextValue)}
        onStarClick={(nextValue) => {
          setValue(nextValue);
          finishEditing();
        }}
      />
    );
  }}
</EditorComponent>
```

## Best Practices

1. **Coerce value to number** - Use `Number(value) || 0` since cell values may be strings.
2. **Provide `name` prop** - Use different names for editor and renderer, such as `"rating"` and `"rating-cell"`, to keep stable React keys.
3. **Call `finishEditing()` on click** - Star click confirms the selection and closes the editor.
4. **Use `onStarHover` for preview** - Improves UX by showing the selection before commit.
5. **Use a custom renderer** - `RatingCellRenderer` with `editing={false}` shows stars in view mode and keeps the UI consistent.
6. **Add a validator** - Use `ratingValidator` to restrict values, such as 0-100 or 1-5, and give immediate feedback.

---


## What you learned

You created a local `StarRating` component and integrated it as a Handsontable cell editor in React. You used `EditorComponent` with the render prop pattern to manage hover preview and click-to-confirm selection, and a React component renderer to display stars in view mode.

## Next steps

- [Star Rating (JavaScript)](@/javascript/recipes/cell-types/rating/rating.md) - The same concept using `editorFactory` and SVG stars with no external library.
- [Star Rating Editor (Angular)](@/angular/recipes/cell-types/guide-rating-angular/guide-rating.md) - The Angular version using `HotCellEditorAdvancedComponent`.
- [Colorful Picker (React)](@/react/recipes/cell-types/colorful-picker/colorful-picker.md) - Another React `EditorComponent` example for color selection.
