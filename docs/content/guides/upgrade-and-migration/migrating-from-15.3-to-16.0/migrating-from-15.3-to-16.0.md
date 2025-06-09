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

### Notes

1. **Breaking changes**: The new wrapper is not backward compatible with the old one. You'll need to update your code according to the steps above.

2. **Component-based approach**: The new wrapper embraces Angular's component-based architecture, allowing you to create custom editors and renderers as Angular components.

3. **Improved TypeScript support**: The new wrapper provides better TypeScript definitions with the `GridSettings` interface.

4. **Standalone components**: The new wrapper fully supports Angular's standalone components, making it easier to use in modern Angular applications.

5. **Global configuration**: The new wrapper provides better global configuration management through dependency injection.

6. **Performance**: The new wrapper is optimized for better performance and follows Angular best practices.

7. **Template syntax**: The simplified template syntax reduces boilerplate and makes configuration more maintainable.

8. **Instance access**: Direct access to the Handsontable instance is now available through `ViewChild` instead of the registerer pattern.

### Step 1: Update package dependencies

Replace the old Angular wrapper package with the new one:

**Remove the old package:**
```bash
npm uninstall @handsontable/angular
```

**Install the new package:**
```bash
npm install @handsontable/angular-wrapper
```

### Step 2: Update imports

The new wrapper uses a different package name and some different import paths.

**Old wrapper imports:**
```ts
import { HotTableModule } from '@handsontable/angular';
import { HotTableRegisterer } from '@handsontable/angular';
```

**New wrapper imports:**
```ts
import { HotTableModule, HotTableComponent, GridSettings } from '@handsontable/angular-wrapper';
import { HotGlobalConfigService } from '@handsontable/angular-wrapper';
```

### Step 3: Update module configuration

The module setup has changed to support both standalone components and traditional NgModules.

**Old wrapper module setup:**
```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';
import { registerAllModules } from 'handsontable/registry';
import { AppComponent } from './app.component';

registerAllModules();

@NgModule({
  imports: [BrowserModule, HotTableModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

**New wrapper module setup:**
```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule, HotGlobalConfigService } from '@handsontable/angular-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { AppComponent } from './app.component';

registerAllModules();

@NgModule({
  imports: [BrowserModule, HotTableModule],
  declarations: [AppComponent],
  providers: [HotGlobalConfigService],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

**New wrapper standalone component setup:**
```ts
import { Component } from '@angular/core';
import { HotTableModule, GridSettings } from '@handsontable/angular-wrapper';

@Component({
  standalone: true,
  imports: [HotTableModule],
  template: `<hot-table [data]="data" [settings]="gridSettings" />`
})
export class AppComponent {
  // component logic
}
```

### Step 4: Update component template syntax

The new wrapper uses a simplified template syntax with a single `settings` property instead of individual properties.

**Old wrapper template:**
```html
<hot-table
  [data]="dataset"
  [colHeaders]="true"
  [rowHeaders]="true"
  [height]="'auto'"
  [autoWrapRow]="true"
  [autoWrapCol]="true"
  [licenseKey]="'non-commercial-and-evaluation'">
  <hot-column data="id" [readOnly]="true" title="ID"></hot-column>
  <hot-column data="name" title="Full name"></hot-column>
  <hot-column data="address" title="Street name"></hot-column>
</hot-table>
```

**New wrapper template:**
```html
<hot-table [data]="data" [settings]="gridSettings" />
```

### Step 5: Update component configuration

Move all configuration options to a `GridSettings` object in your component.

**Old wrapper component:**
```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <hot-table
      [data]="dataset"
      [colHeaders]="true"
      [rowHeaders]="true"
      [height]="'auto'"
      [autoWrapRow]="true"
      [autoWrapCol]="true"
      [licenseKey]="'non-commercial-and-evaluation'">
      <hot-column data="id" [readOnly]="true" title="ID"></hot-column>
      <hot-column data="name" title="Full name"></hot-column>
      <hot-column data="address" title="Street name"></hot-column>
    </hot-table>
  `
})
export class AppComponent {
  dataset = [
    {id: 1, name: 'Ted Right', address: 'Wall Street'},
    {id: 2, name: 'Frank Honest', address: 'Pennsylvania Avenue'},
    // ... more data
  ];
}
```

**New wrapper component:**
```ts
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  standalone: true,
  imports: [HotTableModule],
  template: `<hot-table [data]="data" [settings]="gridSettings" />`
})
export class AppComponent {
  data = [
    {id: 1, name: 'Ted Right', address: 'Wall Street'},
    {id: 2, name: 'Frank Honest', address: 'Pennsylvania Avenue'},
    // ... more data
  ];

  gridSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
    columns: [
      { data: 'id', readOnly: true, title: 'ID' },
      { data: 'name', title: 'Full name' },
      { data: 'address', title: 'Street name' }
    ]
  };
}
```

### Step 6: Update table instance references

The way you reference and interact with the Handsontable instance has changed.

**Old wrapper instance reference:**
```ts
import { HotTableRegisterer } from '@handsontable/angular';

export class AppComponent {
  private hotRegisterer = new HotTableRegisterer();
  id = 'hotInstance';

  swapHotData() {
    this.hotRegisterer.getInstance(this.id).loadData([['new', 'data']]);
  }
}
```

**New wrapper instance reference:**
```ts
import { ViewChild } from '@angular/core';
import { HotTableComponent } from '@handsontable/angular-wrapper';

export class AppComponent {
  @ViewChild(HotTableComponent, { static: false })
  hotTable!: HotTableComponent;

  swapHotData() {
    this.hotTable.hotInstance!.loadData([['new', 'data']]);
  }
}
```

### Step 7: Update global configuration

The new wrapper provides better global configuration management.

**Old wrapper global configuration:**
```ts
// Configuration was typically done per component
export class AppComponent {
  hotSettings = {
    licenseKey: 'non-commercial-and-evaluation',
    // other settings
  };
}
```

**New wrapper global configuration using ApplicationConfig:**
```ts
import { ApplicationConfig } from '@angular/core';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

const globalHotConfig: HotGlobalConfig = {
  license: NON_COMMERCIAL_LICENSE,
  layoutDirection: 'ltr',
  language: 'en',
  themeName: 'ht-theme-main',
};

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: HOT_GLOBAL_CONFIG, useValue: globalHotConfig },
    // other providers
  ],
};
```

**New wrapper global configuration using service:**
```ts
import { HotGlobalConfigService, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

export class AppComponent {
  constructor(private hotConfig: HotGlobalConfigService) {
    this.hotConfig.setConfig({
      license: NON_COMMERCIAL_LICENSE,
      themeName: 'ht-theme-main',
    });
  }
}
```

### Step 8: Update custom editors

The new wrapper introduces component-based editors alongside the traditional class-based approach.

**Old wrapper custom editor:**
```ts
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

// Usage in settings
hotSettings = {
  columns: [{ editor: CustomEditor }]
};
```

**New wrapper component-based editor:**
```ts
import { Component, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HotCellEditorComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-custom-editor',
  imports: [FormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="width: 100%; overflow: hidden">
      <input
        #inputElement
        type="text"
        [value]="getValue()"
        (keydown)="onKeyDown($event)"
        style="width: 100%; box-sizing: border-box"
      />
    </div>
  `,
})
export class CustomEditorComponent extends HotCellEditorComponent<string> {
  @ViewChild('inputElement') inputElement!: ElementRef;

  onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement;
    this.setValue(target.value);
  }

  onFocus(): void {
    this.inputElement.nativeElement.select();
  }
}

// Usage in settings
gridSettings: GridSettings = {
  columns: [{ editor: CustomEditorComponent }]
};
```

### Step 9: Update custom renderers

The new wrapper supports component-based renderers in addition to function-based renderers.

**Old wrapper custom renderer:**
```ts
export class AppComponent {
  hotSettings = {
    columns: [{
      renderer(instance, td, row, col, prop, value, cellProperties) {
        const img = document.createElement('img');
        img.src = value;
        td.innerText = '';
        td.appendChild(img);
        return td;
      }
    }]
  };
}
```

**New wrapper component-based renderer:**
```ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HotCellRendererComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-custom-renderer',
  template: `
    <div class="container" [style.backgroundColor]="value">
      {{ value }}
    </div>
  `,
  styles: [`
    .container {
      height: 100%;
      width: 100%;
    }
    :host {
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0;
    }
  `],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomRendererComponent extends HotCellRendererComponent<string> {}

// Usage in settings
gridSettings: GridSettings = {
  columns: [{ renderer: CustomRendererComponent }]
};
```

### Step 10: Update language configuration

Language configuration has been simplified in the new wrapper.

**Old wrapper language configuration:**
```ts
import { registerLanguageDictionary, plPL } from 'handsontable/i18n';

registerLanguageDictionary(plPL);

export class AppComponent {
  hotSettings = {
    language: 'pl-PL'
  };
}
```

**New wrapper language configuration:**
```ts
import { registerLanguageDictionary, plPL } from 'handsontable/i18n';

registerLanguageDictionary(plPL);

export class AppComponent {
  gridSettings: GridSettings = {
    language: 'pl-PL'
  };
}
```

### Step 11: Update event handling

Event handling remains similar, but the context has changed slightly.

**Old wrapper event handling:**
```ts
export class AppComponent {
  hotSettings = {
    afterChange: (changes, source) => {
      console.log('Data changed:', changes, source);
    }
  };
}
```

**New wrapper event handling:**
```ts
export class AppComponent {
  gridSettings: GridSettings = {
    afterChange: (changes, source) => {
      console.log('Data changed:', changes, source);
    }
  };
}
```

### Step 12: Update CSS imports

Ensure you're importing the correct CSS files for themes.

**CSS imports (same for both wrappers):**
```scss
@import 'handsontable/styles/handsontable.min.css';
@import 'handsontable/styles/ht-theme-main.min.css';
```

**Or in angular.json:**
```json
{
  "styles": [
    "src/styles.scss",
    "node_modules/handsontable/styles/handsontable.min.css",
    "node_modules/handsontable/styles/ht-theme-main.min.css"
  ]
}
``

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