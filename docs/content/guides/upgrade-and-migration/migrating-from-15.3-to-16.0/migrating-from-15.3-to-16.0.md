---
id: 1k7arh9z
title: Migrating from 15.3 to 16.0
metaTitle: Migrating from 15.3 to 16.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 15.3 to Handsontable 16.0, released on [09/07/2025].
permalink: /migration-from-15.3-to-16.0
canonicalUrl: /migration-from-15.3-to-16.0
pageClass: migration-guide
react:
  id: 4k7wrh9z
  metaTitle: Migrate from 15.3 to 16.0 - React Data Grid | Handsontable
angular:
  id: 9v65a4pd
  metaTitle: Migrate from 15.3 to 16.0 - Angular Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

# Migrate from 15.3 to 16.0

Migrate from Handsontable 15.3 to Handsontable 16.0, released on 09/07/2025.

More information about this release can be found in the [`16.0.0` release blog post](https://handsontable.com/blog/handsontable-16-new-angular-wrapper-and-core-improvements]).

[[toc]]

## 1. Introducing the new DOM structure

In Handsontable 16.0, we changed how the table is mounted in the DOM. Previously, the container `<div>` you provided became the root element of the table. Now, that container acts as a mounting point, and Handsontable creates and injects its own root element inside it.

Here's a side-by-side comparison of the old and new DOM structures:

Old DOM structure:

```
body
├── #example.ht-wrapper.handsontable // Root Container/Element
│   ├── .htFocusCatcher // Focus Catcher (top)
│   ├── Data grid content
│   └── .htFocusCatcher // Focus Catcher (down)
├── .hot-display-license-info // License key notification bar
└── Context menus, dropdowns, pop-ups, sidebars
    (absolutely positioned elements)
```

New DOM structure:

```
body
├── #example // Root Wrapper
│    └── .ht-root-wrapper // Root Element
│        ├── .htFocusCatcher // Focus Catcher (top)
│        ├── .ht-wrapper.handsontable // Root Container
│        │   └── Data grid content
│        ├── .htFocusCatcher // Focus Catcher (down)
│        └── .hot-display-license-info // License key notification bar
└── .ht-portal // Portal Element
    └── Context menus, dropdowns, pop-ups, sidebars
        (absolutely positioned elements)
```

### Key changes
- Root Wrapper: User-provided div is now used as a container for the new DOM structure
- Focus Catcher Relocation: Input elements used as focus catchers have been moved outside of the treegrid element for accessibility compliance
- Portal Element: New div.ht-portal with ht-theme class for absolutely positioned elements
- Root Element: rootElement is now created internally by Handsontable instead of using the user-provided container directly

## 2. Updated the CSS variables

In Handsontable 16.0, we've made significant improvements to our CSS variables system to adjust themes colors, variable order and provide better customization options. Here are the key changes:

### New CSS variables
We've introduced new variables that allow for easier customization:

 - `--ht-letter-spacing`: Controls letter spacing for improved readability and visual appearance.
 - `--ht-radio-*`: Enables more accurate styling of radio inputs.
 - `--ht-cell-read-only-background-color`: Allows better customization of read-only cell backgrounds.
 - `--ht-checkbox-indeterminate`: Lets you style the indeterminate state of checkboxes.

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

## 3. Updated the placement of custom borders

In version 16.0, we've updated how custom borders are positioned to improve accuracy and consistency. This change affects the visual positioning of borders, particularly for cells with custom borders.

#### What changed?
- Border positions were adjusted to prevent overlapping with adjacent cells and headers.

#### Why is this a breaking change?
It's very unlikely, but if your application relies on specific border positioning or you've implemented custom styling based on border positions, you may need to update your styles. 

The visual appearance of borders in version `16.0` will be slightly different compared to version `15.3`.

### Migration notes
No code changes are required - the improvements are handled automatically by the new version.

## 4. Switched to the new Angular wrapper (for Angular 16+)

Handsontable 16.0 introduces a completely new Angular wrapper for Handsontable. This wrapper is designed to provide better integration with modern Angular applications and improved developer experience. If you use Angular 16 or higher, we recommend migrating to the new wrapper.

### Why switch to the new Angular wrapper?

- **Component-based approach**: The new wrapper embraces Angular's component-based architecture, allowing you to create custom editors and renderers as Angular components.
- **Improved TypeScript support**: The new wrapper provides better TypeScript definitions.
- **Standalone components**: The new wrapper fully supports Angular's standalone components, making it easier to use in modern Angular applications.
- **Global configuration**: The new wrapper provides better global configuration management through dependency injection.
- **Template syntax**: The simplified template syntax reduces boilerplate and makes configuration more maintainable.
- **Instance access**: Direct access to the Handsontable instance is now available through `ViewChild`.

### Step 1: Update package dependencies

Replace the old Angular wrapper package with the new one:

```bash
npm uninstall @handsontable/angular
npm install @handsontable/angular-wrapper
```

### Step 2: Update component configuration

Move all configuration options to a `GridSettings` object in your component.

**Old wrapper component:**
```ts
@Component({
  selector: 'app-root',
  template: `
    <hot-table
      [data]="data"
      [colHeaders]="true"
      [licenseKey]="'non-commercial-and-evaluation'">
      <hot-column data="id" [readOnly]="true" title="ID"></hot-column>
      <hot-column data="name" title="Full name"></hot-column>
    </hot-table>
  `
})
export class AppComponent {
  data = //...
}
```

**New wrapper component:**
```ts
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  standalone: true,
  imports: [HotTableModule],
  template: `<hot-table [data]="data" [settings]="gridSettings" />`
})
export class AppComponent {
  data = //...;

  gridSettings: GridSettings = {
    colHeaders: true,
    licenseKey: 'non-commercial-and-evaluation',
    columns: [
      { data: 'id', readOnly: true, title: 'ID' },
      { data: 'name', title: 'Full name' },
    ]
  };
}
```

### Step 3: Update table instance references

The way you reference and interact with the Handsontable instance has changed.

**Old wrapper instance reference:**
```ts
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
import { HotTableComponent } from '@handsontable/angular-wrapper';

export class AppComponent {
  @ViewChild(HotTableComponent, { static: false })
  hotTable!: HotTableComponent;

  swapHotData() {
    this.hotTable.hotInstance!.loadData([['new', 'data']]);
  }
}
```

### Step 4: Update global configuration

The new wrapper provides better global configuration management.

**Old wrapper global configuration:**
```ts
// Configuration was typically done per component
export class AppComponent {
  hotSettings = {
    licenseKey: 'non-commercial-and-evaluation',
  };
}
```

**New wrapper global configuration using ApplicationConfig:**
```ts
import { ApplicationConfig } from '@angular/core';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

const globalHotConfig: HotGlobalConfig = {
  license: NON_COMMERCIAL_LICENSE,
  language: 'en',
  themeName: 'ht-theme-main',
};

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: HOT_GLOBAL_CONFIG, useValue: globalHotConfig },
  ],
};
```

**New wrapper global configuration using service:**
```ts
import { HotGlobalConfigService, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

export class AppComponent {
  constructor(private hotConfig: HotGlobalConfigService) {
    this.hotConfig.setConfig({
      themeName: 'ht-theme-main',
    });
  }
}
```

### Step 5: Update custom editors

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

### Step 6: Update custom renderers

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


### Step 7: Update CSS imports

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
```

### Common migration issues

**Issue: "Cannot find module '@handsontable/angular'"**
- **Solution:** Make sure you've updated your imports to use `@handsontable/angular-wrapper`

**Issue: "hot-column is not recognized"**
- **Solution:** The new wrapper doesn't use `<hot-column>`. Move column configuration to the `columns` array in your settings object.

**Issue: "HotTableRegisterer is not defined"**
- **Solution:** Use `@ViewChild(HotTableComponent)` and access the `hotInstance` property instead.

**Issue: "Custom renderer not working"**
- **Solution:** Convert your function-based renderer to a component extending `HotCellRendererComponent`.

**Issue: "Custom editor not working"**
- **Solution:** Convert your class-based editor to a component extending `HotCellEditorComponent`.

This migration guide covers the major changes between the old and new Angular wrappers. The new wrapper provides better integration with modern Angular patterns, improved type safety, and a more maintainable codebase.

## 5. Introducing `pnpm` as the repository package manager

Starting on July 1st, 2025, we've switched to `pnpm` as the repository's main package manager.

As the number of packages in the repository grew, so did the number of dependencies. This made it difficult to manage dependencies and install them in a consistent way. To address this, we've switched to `pnpm` as the main package manager.

### Will this affect me?

Unless you're not creating custom builds of Handsontable or any of the wrappers, this change will not affect you.

If you are, however, you'll need to utilize `pnpm` to install the main repository dependencies.

**Note**: The `examples` and `docs` packages are still managed with `npm`, and are not a part of the main `pnpm` workspace.

### How to migrate?

1. [Install `pnpm`](https://pnpm.io/installation) with a version corresponding to the one defined in the `packageManager` field of the root's `package.json`.
2. If you worked on your clone of the repository before, you'll need to remove the `node_modules` directory, `package-lock.json` files etc.

    You can do this by running `npm run clean:node_modules -- --keep-lockfiles`.
3. Run `pnpm install` to install the dependencies.
4. All the `npm` commands are still available, so you can build the packages as you did before, for example, by running `npm run build`.

You can always find more information on the custom build process in the [Custom builds](https://handsontable.com/docs/custom-builds/) documentation page.
