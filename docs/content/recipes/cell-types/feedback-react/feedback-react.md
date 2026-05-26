---
type: how-to
id: e107bb0d
title: Feedback
metaTitle:  Feedback Cell Type - React Data Grid | Handsontable
description: Learn how to create a custom feedback cell type in React using EditorComponent—emoji buttons (e.g. thumbs up/down/neutral) for quick selection, keyboard navigation, and per-column config.
permalink: /recipes/cell-types/feedback-react
canonicalUrl: /recipes/cell-types/feedback-react
tags:
  - guides
  - tutorial
  - recipes
react:
  id: 41d9ca30
  metaTitle: Feedback Cell Type - React Data Grid | Handsontable
angular:
  id: 6af717ed
  metaTitle: Feedback Cell Type - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
---

This tutorial shows you how to build an emoji feedback cell in React using Handsontable's `EditorComponent`, with per-column configuration and keyboard navigation.

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/cell-types/feedback-react/react/example1.css)
@[code](@/content/recipes/cell-types/feedback-react/react/example1.jsx)
@[code](@/content/recipes/cell-types/feedback-react/react/example1.tsx)

:::

:::

## Overview

This guide shows how to create a feedback editor cell using emoji buttons (👍, 👎, 🤷) with React's `EditorComponent`. The example uses a feature-roadmap table with a Feedback column; the editor supports quick selection, keyboard navigation (Arrow keys, Tab), and per-column configuration via external CSS.

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** None

## What You'll Build

A cell that:
- Displays emoji feedback buttons (👍, 👎, 🤷) when editing
- Shows the selected emoji when viewing
- Supports keyboard navigation (Arrow Left/Right and Tab to cycle options)
- Provides click-to-select and closes the editor on choice
- Uses React's `EditorComponent` with render prop and external CSS (e.g. `feedback-editor` class)
- Reads per-column options from `cellProperties.config` in `onPrepare`

## Prerequisites

```bash
npm install @handsontable/react-wrapper
```

**What you need:**
- React 16.8+ (hooks support)
- `@handsontable/react-wrapper` package
- Basic React knowledge (hooks, JSX)

## Step 1: Import Dependencies

```tsx
import { useState, useEffect, useCallback, ComponentProps } from 'react';
import { HotTable, HotColumn, EditorComponent } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

**What we're importing:**
- `EditorComponent` - React component for creating custom editors
- `HotTable` and `HotColumn` - React wrapper components
- React hooks for state management
- Handsontable styles

## Step 2: Create the Editor Component

Create a React component that uses `EditorComponent` with the render prop pattern.

```tsx
type EditorComponentProps = ComponentProps<typeof EditorComponent<string>>;

const FeedbackEditor = () => {
  const [config, setConfig] = useState<string[]>(['👍', '👎', '🤷']);

  return (
    <EditorComponent<string>>
      {({ value, setValue, finishEditing }) => (
        <div className="editor">
          {config.map((item) => (
            <button
              key={item}
              className={`button ${value === item ? 'active' : ''}`}
              onClick={() => {
                setValue(item);
                finishEditing();
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </EditorComponent>
  );
};
```

**What's happening:**
1. `EditorComponent` wraps your editor UI
2. The `children` prop is a function that receives editor state
3. `value` - Current editor value
4. `setValue` - Function to update the value
5. `finishEditing` - Function to save and close the editor
6. Render buttons for each option in the config
7. Highlight the active button based on current value

**Key concepts:**
- **Render prop pattern**: `EditorComponent` uses a function as children
- **State management**: `value` and `setValue` are provided by `EditorComponent`
- **React components**: Use standard React patterns (JSX, className, onClick)

## Step 3: Add Styling

Style the editor container and buttons using CSS or inline styles.

```tsx
const FeedbackEditor = () => {
  const [config, setConfig] = useState<string[]>(['👍', '👎', '🤷']);

  return (
    <EditorComponent<string>>
      {({ value, setValue, finishEditing }) => (
        <>
          <style>{`
            .editor {
              box-sizing: border-box;
              display: flex;
              gap: 3px;
              padding: 3px;
              background: rgb(238, 238, 238);
              border: 1px solid rgb(204, 204, 204);
              border-radius: 4px;
              height: 100%;
              width: 100%;
            }
            .button.active {
              background: #007bff;
              color: white;
            }
            .button:hover {
              background: #f0f0f0;
            }
            .button {
              background: #fff;
              color: black;
              border: none;
              padding: 0;
              margin: 0;
              height: 100%;
              width: 100%;
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              cursor: pointer;
            }
          `}</style>
          <div className="editor">
            {config.map((item, _index, _array) => (
              <button
                key={item}
                className={`button ${value === item ? 'active' : ''}`}
                onClick={() => {
                  setValue(item);
                  finishEditing();
                }}
                style={{
                  width: `${100 / _array.length}%`
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </>
      )}
    </EditorComponent>
  );
};
```

**What's happening:**
- Container uses flexbox for horizontal button layout
- Buttons dynamically size based on config length
- Active button has blue background
- Hover effects for better UX

**Key styling:**
- `display: flex` - Horizontal button layout
- `gap: 3px` - Space between buttons
- `width: ${100 / _array.length}%` - Dynamic button width
- `.active` class - Highlights selected button

## Step 4: Read Config from Cell Properties

Use `onPrepare` to read per-column configuration.

```tsx
const FeedbackEditor = () => {
  const [config, setConfig] = useState<string[]>(['👍', '👎', '🤷']);

  const onPrepare: EditorComponentProps['onPrepare'] = (
    _row,
    _column,
    _prop,
    _TD,
    _originalValue,
    cellProperties
  ) => {
    // Read config from column definition
    if (cellProperties.config) {
      setConfig(cellProperties.config as string[]);
    }
  };

  return (
    <EditorComponent<string> onPrepare={onPrepare}>
      {({ value, setValue, finishEditing }) => (
        // ... editor UI
      )}
    </EditorComponent>
  );
};
```

**What's happening:**
- `onPrepare` is called before the editor opens
- `cellProperties` contains column-specific configuration
- Read `config` from `cellProperties.config`
- Update state to reflect column-specific options

**Why this matters:**
- Different columns can have different options
- One editor component, multiple configurations
- Dynamic options based on column settings

## Step 5: Add Keyboard Shortcuts

Add keyboard navigation using the `shortcuts` prop.

```tsx
const FeedbackEditor = () => {
  const [config, setConfig] = useState<string[]>(['👍', '👎', '🤷']);
  const [shortcuts, setShortcuts] = useState<EditorComponentProps['shortcuts']>([]);

  const getNextValue = useCallback((value: string) => {
    const index = config.indexOf(value);
    return index === config.length - 1 ? config[0] : config[index + 1];
  }, [config]);

  const getPrevValue = useCallback((value: string) => {
    const index = config.indexOf(value);
    return index === 0 ? config[config.length - 1] : config[index - 1];
  }, [config]);

  useEffect(() => {
    setShortcuts([
      {
        keys: [['ArrowRight'], ['Tab']],
        callback: ({ value, setValue }, _event) => {
          setValue(getNextValue(value));
          return false; // Prevent default Tab behavior
        }
      },
      {
        keys: [['ArrowLeft']],
        callback: ({ value, setValue }, _event) => {
          setValue(getPrevValue(value));
        }
      }
    ]);
  }, [config, getNextValue, getPrevValue]);

  return (
    <EditorComponent<string> shortcuts={shortcuts}>
      {({ value, setValue, finishEditing }) => (
        // ... editor UI
      )}
    </EditorComponent>
  );
};
```

**What's happening:**
- **ArrowRight/Tab**: Move to next option (wraps to first if at end)
- **ArrowLeft**: Move to previous option (wraps to last if at start)
- `callback` receives `{ value, setValue, finishEditing }` as first parameter
- Return `false` to prevent default behavior (e.g., Tab moving to next cell)

**Keyboard navigation benefits:**
- Fast selection without mouse
- Accessible for keyboard-only users
- Intuitive left/right navigation
- Tab cycles through options instead of moving cells

## Step 6: Complete Editor Component

Put it all together:

```tsx
type EditorComponentProps = ComponentProps<typeof EditorComponent<string>>;

const FeedbackEditor = () => {
  const [config, setConfig] = useState<string[]>(['👍', '👎', '🤷']);
  const [shortcuts, setShortcuts] = useState<EditorComponentProps['shortcuts']>([]);

  const onPrepare: EditorComponentProps['onPrepare'] = (
    _row,
    _column,
    _prop,
    _TD,
    _originalValue,
    cellProperties
  ) => {
    if (cellProperties.config) {
      setConfig(cellProperties.config as string[]);
    }
  };

  const getNextValue = useCallback((value: string) => {
    const index = config.indexOf(value);
    return index === config.length - 1 ? config[0] : config[index + 1];
  }, [config]);

  const getPrevValue = useCallback((value: string) => {
    const index = config.indexOf(value);
    return index === 0 ? config[config.length - 1] : config[index - 1];
  }, [config]);

  useEffect(() => {
    setShortcuts([
      {
        keys: [['ArrowRight'], ['Tab']],
        callback: ({ value, setValue }, _event) => {
          setValue(getNextValue(value));
          return false;
        }
      },
      {
        keys: [['ArrowLeft']],
        callback: ({ value, setValue }, _event) => {
          setValue(getPrevValue(value));
        }
      }
    ]);
  }, [config, getNextValue, getPrevValue]);

  return (
    <EditorComponent<string> onPrepare={onPrepare} shortcuts={shortcuts}>
      {({ value, setValue, finishEditing }) => (
        <>
          <style>{`
            .editor {
              box-sizing: border-box;
              display: flex;
              gap: 3px;
              padding: 3px;
              background: rgb(238, 238, 238);
              border: 1px solid rgb(204, 204, 204);
              border-radius: 4px;
              height: 100%;
              width: 100%;
            }
            .button.active:hover,
            .button.active {
              background: #007bff;
              color: white;
            }
            .button:hover {
              background: #f0f0f0;
            }
            .button {
              background: #fff;
              color: black;
              border: none;
              padding: 0;
              margin: 0;
              height: 100%;
              width: 100%;
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              cursor: pointer;
            }
          `}</style>
          <div className="editor">
            {config.map((item, _index, _array) => (
              <button
                key={item}
                className={`button ${value === item ? 'active' : ''}`}
                onClick={() => {
                  setValue(item);
                  finishEditing();
                }}
                style={{
                  width: `${100 / _array.length}%`
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </>
      )}
    </EditorComponent>
  );
};
```

**What's happening:**
- **State management**: `config` and `shortcuts` managed with React hooks
- **onPrepare**: Reads column-specific config
- **shortcuts**: Keyboard navigation handlers
- **Render prop**: Renders buttons based on config
- **Styling**: CSS-in-JS for editor appearance

## Step 7: Use in Handsontable

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
      data={data}
      colHeaders={true}
    >
      <HotColumn
        width={250}
        editor={FeedbackEditor}
        config={['👍', '👎', '🤷']}
        data="feedback"
        title="Feedback"
      />
      <HotColumn
        width={250}
        editor={FeedbackEditor}
        config={['1', '2', '3', '4', '5']}
        data="stars"
        title="Rating (1-5)"
      />
    </HotTable>
  );
};
```

**What's happening:**
- `editor={FeedbackEditor}` - Assigns the editor component to the column
- `config={['👍', '👎', '🤷']}` - Column-specific options
- Same editor component, different configurations per column

**Key features:**
- Reusable editor component
- Per-column configuration
- Type-safe with TypeScript

## How It Works - Complete Flow

1. **Initial Render**: Cell displays the emoji value (👍, 👎, or 🤷)
2. **User Double-Clicks or Enter**: Editor opens, `onPrepare` reads column config
3. **Editor Opens**: `EditorComponent` positions container over cell
4. **Button Display**: All options visible, current value highlighted
5. **User Interaction**:
   - Click a button → `setValue(item)` and `finishEditing()` called
   - Press ArrowLeft/Right → Shortcut callback updates value
   - Press Tab → Cycles through options (prevents default cell navigation)
6. **Visual Feedback**: Selected button highlighted in blue
7. **User Confirms**: Press Enter, click button, or click away
8. **Save**: Value saved to cell
9. **Editor Closes**: Cell shows selected emoji

## Enhancements

### 1. Custom Renderer with Styling

Add a custom renderer to style the emoji display:

```tsx
import { rendererFactory } from 'handsontable/renderers';

const cellDefinition = {
  renderer: rendererFactory(({ td, value }) => {
    td.innerHTML = `
      <div style="text-align: center; font-size: 1.5em; padding: 4px;">
        ${value || '🤷'}
      </div>
    `;
  })
};

// Use in HotColumn
<HotColumn
  editor={FeedbackEditor}
  renderer={cellDefinition.renderer}
  config={['👍', '👎', '🤷']}
  data="feedback"
/>
```

**What's happening:**
- Center-aligns the emoji
- Increases font size for better visibility
- Adds padding for spacing

### 2. More Feedback Options

Add more emoji options:

```tsx
<HotColumn
  editor={FeedbackEditor}
  config={['👍', '👎', '🤷', '❤️', '🔥', '⭐']}
  data="feedback"
/>
```

The editor automatically adjusts button widths based on config length.

### 3. Custom Button Styling

Enhanced button appearance with CSS:

```tsx
<style>{`
  .button {
    padding: 8px;
    border: 2px solid #ddd;
    background: white;
    color: #333;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.2em;
    transition: all 0.2s;
  }
  .button.active {
    border-color: #007bff;
    background: #007bff;
    color: white;
  }
  .button:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`}</style>
```

### 4. Dynamic Config from Cell Properties

The `onPrepare` hook already handles this -- pass different configs:

```tsx
<HotColumn
  editor={FeedbackEditor}
  config={['👍', '👎', '❤️', '🔥']}
  data="feedback"
/>
```

### 5. Tooltip on Hover

Add tooltips to buttons:

```tsx
{config.map((item) => {
  const tooltips: Record<string, string> = {
    '👍': 'Positive feedback',
    '👎': 'Negative feedback',
    '🤷': 'Neutral feedback'
  };

  return (
    <button
      key={item}
      className={`button ${value === item ? 'active' : ''}`}
      onClick={() => {
        setValue(item);
        finishEditing();
      }}
      title={tooltips[item] || ''}
    >
      {item}
    </button>
  );
})}
```

### 6. Text Labels Instead of Emojis

Use text buttons for clarity:

```tsx
<HotColumn
  editor={FeedbackEditor}
  config={['Positive', 'Negative', 'Neutral']}
  data="feedback"
/>
```

The editor works with any string values, not just emojis.

### 7. Using External CSS File

Move styles to a separate CSS file:

```css
/* feedback-editor.css */
.editor {
  box-sizing: border-box;
  display: flex;
  gap: 3px;
  padding: 3px;
  background: rgb(238, 238, 238);
  border: 1px solid rgb(204, 204, 204);
  border-radius: 4px;
  height: 100%;
  width: 100%;
}

.button.active {
  background: #007bff;
  color: white;
}

.button:hover {
  background: #f0f0f0;
}

.button {
  background: #fff;
  color: black;
  border: none;
  padding: 0;
  margin: 0;
  height: 100%;
  width: 100%;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  cursor: pointer;
}
```

```tsx
import './feedback-editor.css';

const FeedbackEditor = () => {
  // ... component code without <style> tag
};
```

## Accessibility

React buttons are inherently accessible, but you can enhance them:

```tsx
{config.map((item, index) => (
  <button
    key={item}
    className={`button ${value === item ? 'active' : ''}`}
    onClick={() => {
      setValue(item);
      finishEditing();
    }}
    aria-label={`${item} feedback option`}
    aria-pressed={value === item}
    tabIndex={value === item ? 0 : -1}
  >
    {item}
  </button>
))}
```

**Keyboard navigation:**
- **Tab**: Navigate to editor (focuses active button)
- **Arrow Left/Right**: Cycle through options (via shortcuts)
- **Enter**: Select current option and finish editing
- **Escape**: Cancel editing
- **Click**: Direct selection

**ARIA attributes:**
- `aria-label`: Describes each button
- `aria-pressed`: Indicates selected state
- `tabIndex`: Controls keyboard focus order

## Performance Considerations

### Why This Is Fast

1. **React Virtual DOM**: Efficient updates only when value changes
2. **No External Libraries**: Zero overhead beyond React
3. **Efficient Re-renders**: Only re-renders when config or value changes
4. **Native Events**: Browser-optimized click handlers

### React Hooks Optimization

The `useCallback` and `useEffect` hooks ensure shortcuts are only recreated when config changes:

```tsx
const getNextValue = useCallback((value: string) => {
  const index = config.indexOf(value);
  return index === config.length - 1 ? config[0] : config[index + 1];
}, [config]); // Only recreate if config changes

useEffect(() => {
  setShortcuts([...]);
}, [config, getNextValue, getPrevValue]); // Only update when dependencies change
```

## TypeScript Support

`EditorComponent` is fully typed. You can specify the value type:

```tsx
<EditorComponent<string>>
  {({ value, setValue, finishEditing }) => {
    // TypeScript knows value is string | undefined
    // TypeScript knows setValue accepts string
    return (
      // ... editor UI
    );
  }}
</EditorComponent>
```

For number-based feedback:

```tsx
<EditorComponent<number>>
  {({ value, setValue, finishEditing }) => {
    // TypeScript knows value is number | undefined
    return (
      // ... editor UI
    );
  }}
</EditorComponent>
```

## Best Practices

1. **Use `onPrepare` for per-cell configuration** - Access `cellProperties` to read custom options
2. **Handle keyboard events properly** - Use shortcuts for navigation
3. **Call `finishEditing()` appropriately** - When user confirms changes (Enter, blur, button click)
4. **Keep render prop function focused** - Extract complex logic into separate components or hooks
5. **Use `useCallback` for helper functions** - Prevents unnecessary re-renders
6. **Update shortcuts in `useEffect`** - Ensures shortcuts match current config

---


## What you learned

You built an emoji feedback cell editor in React using Handsontable's `EditorComponent`. You used the render prop pattern to render configurable option buttons, `onPrepare` to read per-column configuration from `cellProperties`, and the `shortcuts` prop for keyboard navigation.

## Next steps

- [Feedback (JavaScript)](@/javascript/recipes/cell-types/feedback/feedback.md) - The same pattern using `editorFactory` with Handsontable CSS tokens.
- [Feedback Editor (Angular)](@/angular/recipes/cell-types/guide-feedback-angular/guide-feedback.md) - The Angular version using `HotCellEditorAdvancedComponent`.
- [Star Rating (React)](@/react/recipes/cell-types/react-rating/react-rating.md) - Another React editor using `EditorComponent` for numeric selection.
