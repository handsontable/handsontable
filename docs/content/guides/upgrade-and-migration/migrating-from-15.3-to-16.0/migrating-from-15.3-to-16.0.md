---
id: migrating-15.3-to-16.0
title: Migrating from 15.3 to 16.0
metaTitle: Migrating from 15.3 to 16.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 15.3 to Handsontable 16.0, released on [].
permalink: /migration-from-15.3-to-16.0
canonicalUrl: /migration-from-15.3-to-16.0
pageClass: migration-guide
react:
  id: migrating-15.3-to-16.0-react
  metaTitle: Migrate from 15.3 to 16.0 - React Data Grid | Handsontable
angular:
  id: migrating-15.3-to-16.0-angular
  metaTitle: Migrate from 15.3 to 16.0 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrate from 15.3 to 16.0

Migrate from Handsontable 15.3 to Handsontable 16.0, released on [TODO].

[[toc]]

## 1. Introducing the new DOM structure

In Handsontable 16.0, we updated the DOM structure. The main change is how the table is mounted. Previously, the container `<div>` you provided became the root element of the table. In the new approach, that `<div>` is now just the element into which the Handsontable instance is injected.

Here is a comparison of the old and new DOM structures:

Old DOM structure:

```
body
├── #example.ht-wrapper.handsontable
│   ├── Focus catcher (top)
│   ├── Personal details table/grid content
│   └── Focus catcher (bottom)
├── License key notification bar
└── Context menus, dropdowns, pop-ups, sidebars
    (absolutely positioned elements)
```

New DOM structure:

```
body
└── #example
    └── .ht-root-wrapper
        ├── Focus catcher (top)
        ├── .ht-wrapper.handsontable
        │   ├── Personal details table/grid content
        │   ├── License key notification bar
        │   ├── Future: Status bar
        │   └── Future: Pagination bar
        ├── Focus catcher (bottom)
        └── .ht-portal
            └── Context menus, dropdowns, pop-ups, sidebars
                (absolutely positioned elements)
```

### Key changes
- Root Wrapper: User-provided div is now used as a container for the new DOM structure
- Focus Catcher Relocation: Input elements used as focus catchers have been moved outside of the treegrid element for accessibility compliance
- Portal Element: New div.ht-portal with ht-theme class for absolutely positioned elements
- Root Element: rootElement is now created internally by Handsontable instead of using the user-provided container directly

## 2. Update the css variables

In Handsontable 16.0, we've made significant improvements to our CSS variables system to adjust themes colors, variable order and provide better customization options. Here are the key changes:

### New css variables
We've introduced new variables that allow for easier customization: 

 - `--ht-letter-spacing`: controls the spacing between letters for better readability and visual appearance
 - `--ht-radio-[]`: style radio input more accurate
 - `--ht-cell-read-only-background-color`: better adjust readonly cells
 - `--ht-checkbox-indeterminate`: customize checkbox indeterminate state

### Renamed CSS variables
We've renamed a few variables to ensure more consistent naming: 

| Old variable name                                | New variable name                                |
|--------------------------------------------------|--------------------------------------------------|
| `--ht-icon-active-button-border-color`           | `--ht-icon-button-active-border-color`           |
| `--ht-icon-active-button-background-color`       | `--ht-icon-button-active-background-color`       |
| `--ht-icon-active-button-icon-color`             | `--ht-icon-button-active-icon-color`             |
| `--ht-icon-active-button-hover-border-color`     | `--ht-icon-button-active-hover-border-color`     |
| `--ht-icon-active-button-hover-background-color` | `--ht-icon-button-active-hover-background-color` |
| `--ht-icon-active-button-hover-icon-color`       | `--ht-icon-button-active-hover-icon-color`       |

### Migration notes
If you were using custom CSS variables in version 15.3, you'll need to:

1. Review your custom variable names against the new naming convention
2. Update variable references to the new radio input (only if checkbox variables were changed)
3. Take advantage of the new variables for more granular control

## 3. Update the placement of custom borders

In Handsontable 16.0, we've updated how custom borders are positioned to improve accuracy and consistency.

### Key changes in border placement
- Borders are positioned to ensure that all borders remain within the table

### Migration notes
No code changes are required - the improvements are handled automatically by the new version.

## 4. Migrate the Angular wrapper

Version 16.0 introduces a completely new Angular wrapper for Handsontable. This wrapper is designed to provide better integration with modern Angular applications and improved developer experience. If your app uses the `@handsontable/angular` package, you need to switch to the new `@handsontable/angular-wrapper` package and adjust your code following these steps:

### Step 1: Update package dependencies

Replace the old Angular wrapper with the new one in your `package.json`:

**Old dependency:**
```json
{
  "dependencies": {
    "@handsontable/angular": "^15.3.0"
  }
}
```

**New dependency:**
```json
{
  "dependencies": {
    "@handsontable/angular-wrapper": "^16.0.0"
  }
}
```

### Step 2: Update imports and module registration

The new wrapper has different import paths and module registration approach.

**Old wrapper (module-based approach):**
```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';
import { registerAllModules } from 'handsontable/registry';
import { AppComponent } from './app.component';

// register Handsontable's modules
registerAllModules();

@NgModule({
  imports: [BrowserModule, HotTableModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

**New wrapper (standalone components approach):**
```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HOT_GLOBAL_CONFIG, HotConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
import { routes } from './app.routes';

const globalHotConfig: HotConfig = {
  license: NON_COMMERCIAL_LICENSE,
  themeName: 'ht-theme-main-dark-auto'
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: HOT_GLOBAL_CONFIG, useValue: globalHotConfig }
  ],
};
```

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HotTableModule],
  template: `<hot-table [settings]="hotSettings"></hot-table>`
})
export class AppComponent {
  // component implementation
}
```

### Step 3: Update component template syntax

The new wrapper uses a different approach for configuring Handsontable.

**Old wrapper (individual properties and hot-column):**
```html
<hot-table
  [data]="dataset"
  [colHeaders]="true"
  height="auto"
  [autoWrapRow]="true"
  [autoWrapCol]="true"
  licenseKey="non-commercial-and-evaluation">
    <hot-column data="id" [readOnly]="true" title="ID"></hot-column>
    <hot-column data="name" title="Full name"></hot-column>
    <hot-column data="address" title="Street name"></hot-column>
</hot-table>
```

**New wrapper (settings object):**
```html
<hot-table [settings]="hotSettings"></hot-table>
```

```typescript
export class AppComponent {
  hotSettings: GridSettings = {
    data: [
      {id: 1, name: 'Ted Right', address: 'Wall Street'},
      {id: 2, name: 'Frank Honest', address: 'Pennsylvania Avenue'},
      // ... more data
    ],
    columns: [
      { data: 'id', readOnly: true, title: 'ID' },
      { data: 'name', title: 'Full name' },
      { data: 'address', title: 'Street name' }
    ],
    colHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation'
  };
}
```

### Step 4: Update Handsontable instance referencing

The way you access the Handsontable instance has changed significantly.

**Old wrapper (HotTableRegisterer):**
```typescript
import { HotTableRegisterer } from '@handsontable/angular';

export class AppComponent {
  private hotRegisterer = new HotTableRegisterer();
  id = 'hotInstance';

  swapHotData() {
    this.hotRegisterer.getInstance(this.id).loadData([['new', 'data']]);
  }
}
```

```html
<hot-table [hotId]="id" [settings]="hotSettings"></hot-table>
```

**New wrapper (ViewChild approach):**
```typescript
import { Component, ViewChild } from '@angular/core';
import { HotTableComponent } from '@handsontable/angular-wrapper';

export class AppComponent {
  @ViewChild(HotTableComponent, {static: false}) 
  readonly hotTable!: HotTableComponent;

  swapHotData() {
    const hotInstance = this.hotTable.hotInstance;
    hotInstance?.loadData([['new', 'data']]);
  }
}
```

```html
<hot-table [settings]="hotSettings"></hot-table>
```

### Step 5: Update custom renderers

Custom renderers now use Angular components instead of functions.

**Old wrapper (function-based renderers):**
```typescript
export class AppComponent {
  hotSettings: Handsontable.GridSettings = {
    columns: [
      {},
      {
        renderer(instance, td, row, col, prop, value, cellProperties) {
          const img = document.createElement('img');
          img.src = value;
          td.innerText = '';
          td.appendChild(img);
          return td;
        }
      }
    ]
  };
}
```

**New wrapper (component-based renderers):**
```typescript
// custom-image-renderer.component.ts
import { Component } from '@angular/core';
import { HotCellRendererComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-custom-image-renderer',
  template: `<img [src]="value" alt="Image" />`,
  standalone: true,
})
export class CustomImageRendererComponent extends HotCellRendererComponent<string> {
}
```

```typescript
// app.component.ts
export class AppComponent {
  readonly CustomImageRenderer = CustomImageRendererComponent;
  
  hotSettings: GridSettings = {
    columns: [
      {},
      {
        renderer: this.CustomImageRenderer
      }
    ]
  };
}
```

### Step 6: Update custom editors

Custom editors also use Angular components in the new wrapper.

**Old wrapper (class-based editors):**
```typescript
import { TextEditor } from 'handsontable/editors/textEditor';

export class CustomEditor extends TextEditor {
  override createElements() {
    super.createElements();
    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('placeholder', 'Custom placeholder');
    this.TEXTAREA.setAttribute('data-hot-input', 'true');
    this.textareaStyle = this.TEXTAREA.style;
    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

export class AppComponent {
  hotSettings: Handsontable.GridSettings = {
    columns: [
      {
        editor: CustomEditor
      }
    ]
  };
}
```

**New wrapper (component-based editors):**
```typescript
// custom-editor.component.ts
import { Component } from '@angular/core';
import { HotCellEditorComponent } from '@handsontable/angular-wrapper';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-editor',
  imports: [FormsModule],
  template: `
    <input 
      type="text" 
      [(ngModel)]="inputValue" 
      placeholder="Custom placeholder"
      style="width: 100%" 
    />
  `,
  standalone: true,
})
export class CustomEditorComponent extends HotCellEditorComponent<string> {
  inputValue!: string;

  override getValue(): string {
    return this.inputValue;
  }
  
  override setValue(value: string): void {
    this.inputValue = value;
  }

  override onClose(): void {
    // Handle editor close
  }

  override onFocus(): void {
    // Handle editor focus
  }
}
```

```typescript
// app.component.ts
export class AppComponent {
  readonly CustomEditor = CustomEditorComponent;
  
  hotSettings: GridSettings = {
    columns: [
      {
        editor: this.CustomEditor
      }
    ]
  };
}
```

### Step 7: Update global configuration

The new wrapper provides a service-based approach for global configuration.

**Old wrapper:**
Global configuration was handled through Handsontable's native configuration or module imports.

**New wrapper:**
```typescript
// Global configuration via injection token
import { HOT_GLOBAL_CONFIG, HotConfig } from '@handsontable/angular-wrapper';

const globalHotConfig: HotConfig = {
  license: 'your-license-key',
  themeName: 'ht-theme-main-dark-auto'
};

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: HOT_GLOBAL_CONFIG, useValue: globalHotConfig }
  ],
};
```

```typescript
// Runtime configuration via service
import { HotConfigService } from '@handsontable/angular-wrapper';

@Component({
  providers: [HotConfigService]
})
export class AppComponent {
  constructor(private hotConfig: HotConfigService) {}

  toggleTheme() {
    const currentTheme = this.hotConfig.getConfig().themeName;
    const newTheme = currentTheme === 'ht-theme-main' 
      ? 'ht-theme-main-dark' 
      : 'ht-theme-main';
    
    this.hotConfig.setConfig({
      themeName: newTheme
    });
  }
}
```

### Step 8: Update module registration

The new wrapper handles module registration differently.

**Old wrapper:**
```typescript
import { registerAllModules } from 'handsontable/registry';
import {
  registerCellType,
  NumericCellType,
} from 'handsontable/cellTypes';
import {
  registerPlugin,
  UndoRedo,
} from 'handsontable/plugins';

// Register all modules
registerAllModules();

// Or register specific modules
registerCellType(NumericCellType);
registerPlugin(UndoRedo);
```

**New wrapper:**
Module registration is handled automatically by the new wrapper. You no longer need to manually register modules in most cases. The wrapper automatically registers the modules you need based on your configuration.

### Step 9: Update styling and themes

Theme application has been simplified in the new wrapper.

**Old wrapper:**
```scss
@import '~handsontable/styles/handsontable.min.css';
@import '~handsontable/styles/ht-theme-main.min.css';
```

```html
<div class="ht-theme-main">
  <hot-table [settings]="hotSettings"></hot-table>
</div>
```

**New wrapper:**
```scss
@import '~handsontable/styles/handsontable.min.css';
@import '~handsontable/styles/ht-theme-main.min.css';
```

```typescript
// Theme is applied via settings
hotSettings: GridSettings = {
  themeName: 'ht-theme-main',
  // other settings...
};
```

```html
<!-- No wrapper div needed -->
<hot-table [settings]="hotSettings"></hot-table>
```

### Common migration issues

**Issue: "Cannot find module '@handsontable/angular'"**
- **Solution:** Make sure you've updated your imports to use `@handsontable/angular-wrapper`

**Issue: "hot-column is not recognized"**
- **Solution:** The new wrapper doesn't use `<hot-column>`. Move column configuration to the `columns` array in your settings object.

**Issue: "HotTableRegisterer is not defined"**
- **Solution:** Use `@ViewChild(HotTableComponent)` and access `hotInstance` property instead.

**Issue: "Custom renderer not working"**
- **Solution:** Convert your function-based renderer to a component extending `HotCellRendererComponent`.

**Issue: "Custom editor not working"**
- **Solution:** Convert your class-based editor to a component extending `HotCellEditorComponent`.

This migration guide covers the major changes between the old and new Angular wrappers. The new wrapper provides better integration with modern Angular patterns, improved type safety, and a more maintainable codebase.
