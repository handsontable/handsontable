---
name: angular-wrapper-dev
path: wrappers/angular-wrapper/**
description: Use when developing or modifying the @handsontable/angular-wrapper package - Angular components with decorators, NgZone performance optimization, and ng-packagr build system
---

# Angular Wrapper Development

## Package location

`wrappers/angular-wrapper/`

Library source lives under `projects/hot-table/src/lib/`.

## Component architecture

The main `HotTableComponent` uses Angular `@Component` with individual `@Input()` decorators for each Handsontable option. This gives consumers standard Angular template binding for every grid setting.

### Lifecycle

- **AfterViewInit** - creates the Handsontable instance on the DOM element obtained via `@ViewChild('container')`.
- **OnChanges** - detects input property changes and calls `updateSettings()` with the new values.
- **OnDestroy** - calls `hot.destroy()` and cleans up references.

### Performance

`NgZone.runOutsideAngular()` wraps the Handsontable constructor and most grid operations. This prevents Angular change detection from running on every internal grid event (scroll, render, mouse move), which is critical for performance with large datasets.

## Services

- **HotSettingsResolver** - resolves and merges settings from component inputs, handling priority between individual inputs and the aggregate settings object.
- **HotGlobalConfig** - provides global default settings that apply to all HotTable instances in the application.

## Module system

`HotTableModule` is the Angular module that declares and exports the component. Consumers add it to their `imports` array in standalone components.

## Build and test

- **Build system:** ng-packagr 16.
- **Tests:** Jest with `jest-preset-angular`.
- **Gotcha:** Tests require `NODE_OPTIONS=--openssl-legacy-provider` (already configured in the test script).
- **Run tests:** `npm run test --prefix wrappers/angular-wrapper`
- **Important:** Build core first with `npm run build --prefix handsontable`. Wrappers consume `handsontable/tmp/`, not `dist/`.

## Key files

| File | Purpose |
|---|---|
| `projects/hot-table/src/lib/hot-table.component.ts` | Main grid component |
| `projects/hot-table/src/lib/services/` | Settings resolver and global config services |
| `projects/hot-table/src/lib/hot-table.module.ts` | Angular module declaration |

## Modern Angular patterns (required for all new and updated examples)

### Standalone components

All Angular example components must use `standalone: true` with `HotTableModule` in the `imports` array. Do **not** use `standalone: false` or `NgModule`-based declarations.

```typescript
import { Component } from '@angular/core';
import { HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example1',
  standalone: true,
  imports: [HotTableModule],
  template: `<hot-table [settings]="hotSettings"></hot-table>`,
})
export class AppComponent { ... }
```

### app.config.ts instead of app.module.ts

Replace `AppModule` (`@NgModule`) with an `ApplicationConfig` in `app.config.ts`. Register Handsontable modules and provide the global license key here:

```typescript
/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
```

- `provideZoneChangeDetection({ eventCoalescing: true })` is required in every `app.config.ts`.
- The global `HOT_GLOBAL_CONFIG` license replaces per-table `licenseKey` on every `<hot-table>`. Do **not** add `licenseKey` to individual component settings.
- `CommonModule` and `BrowserModule` are no longer needed in standalone components.

### Template control flow

Use Angular 17+ built-in control flow syntax instead of structural directives:

| Old (do not use) | New (required) |
|---|---|
| `*ngIf="condition"` | `@if (condition) { ... }` |
| `*ngFor="let x of list"` | `@for (x of list; track x.id) { ... }` |

Example:
```html
@if (isOpen) {
  <ul role="listbox">
    @for (opt of options; track opt.value) {
      <li (click)="select(opt.value)">{{ opt.label }}</li>
    }
  </ul>
}
```

### Type safety

- Use `RowObject` from `handsontable/common` instead of `any[]` for row data arrays.
- Use typed `querySelector`: `document.querySelector<HTMLInputElement>('#my-input')`.
- Use non-null assertion on `hotInstance` where the instance is guaranteed to exist: `this.hotTable.hotInstance!.updateSettings(...)`.
- Use `hotInstance!.updateSettings()` to change settings at runtime -- never destroy and recreate the Handsontable instance.

```typescript
import { RowObject } from 'handsontable/common';

export class AppComponent {
  hotData: RowObject[] = [];
}
```

### Component naming

Name all example components `AppComponent`, not `ExampleNComponent` or feature-specific names.

## Rules

- No business logic in wrappers. All data transformation and validation belongs in `handsontable/src/`.
- Cross-platform npm scripts: use Node.js `.mjs` helpers instead of bash-only constructs. Never use bash-specific syntax (`if [ ]`, `mv`, `&&` with `||`) directly in `package.json` script entries.
- Never add `licenseKey` to individual `<hot-table>` settings in examples -- set it globally via `HOT_GLOBAL_CONFIG` in `app.config.ts`.
- Never use `standalone: false` in new or updated example components.
- Never use `*ngIf` or `*ngFor` in new or updated templates -- use `@if` / `@for` control flow.
