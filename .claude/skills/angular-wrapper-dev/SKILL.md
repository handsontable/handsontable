---
name: angular-wrapper-dev
path: wrappers/angular-wrapper/**
description: Use when developing or modifying the @handsontable/angular-wrapper package - Angular components with decorators, NgZone performance optimization, and ng-packagr build system
---

# Angular Wrapper Development

Package: `wrappers/angular-wrapper/`; library source in `projects/hot-table/src/lib/`. Wrapper rules, build, and test commands: `wrappers/angular-wrapper/AGENTS.md`.

## Architecture

`HotTableComponent` uses `@Component` with an `@Input()` per Handsontable option.

- **AfterViewInit:** creates the instance on the `@ViewChild('container')` element.
- **OnChanges:** calls `updateSettings()` with the changed inputs.
- **OnDestroy:** `hot.destroy()` and reference cleanup.
- `NgZone.runOutsideAngular()` wraps the constructor and most grid operations so internal grid events skip change detection.

Services: **HotSettingsResolver** merges component inputs with the aggregate settings object (priority between them); **HotGlobalConfig** supplies global defaults for all instances. `HotTableModule` declares and exports the component.

Build: ng-packagr 16. Tests: Jest with `jest-preset-angular` and `NODE_OPTIONS=--openssl-legacy-provider` (already in the script). Wrappers consume `handsontable/tmp/`, not `dist/`; run `npm run test --prefix wrappers/angular-wrapper` after `npm run build --prefix handsontable`.

| File | Purpose |
|---|---|
| `projects/hot-table/src/lib/hot-table.component.ts` | Main grid component |
| `projects/hot-table/src/lib/services/` | Settings resolver and global config |
| `projects/hot-table/src/lib/hot-table.module.ts` | Angular module |

## Modern Angular patterns (all new and updated examples)

### Standalone components

`standalone: true` with `HotTableModule` in `imports`.

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

### app.config.ts

Use an `ApplicationConfig` in `app.config.ts` in place of `AppModule` (`@NgModule`). Register Handsontable modules and the global license key there:

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

- `provideZoneChangeDetection({ eventCoalescing: true })` goes in every `app.config.ts`.
- The global `HOT_GLOBAL_CONFIG` license replaces per-table `licenseKey` on every `<hot-table>`; set `licenseKey` nowhere in component settings.
- Standalone components need no `CommonModule` or `BrowserModule`.

### Template control flow

Use Angular 17+ built-in control flow instead of structural directives.

| Old | Required |
|---|---|
| `*ngIf="condition"` | `@if (condition) { ... }` |
| `*ngFor="let x of list"` | `@for (x of list; track x.id) { ... }` |

### Type safety

- `RowObject` from `handsontable` for row data arrays, in place of `any[]` (`hotData: RowObject[] = []`).
- Typed `querySelector`: `document.querySelector<HTMLInputElement>('#my-input')`.
- `this.hotTable.hotInstance!.updateSettings(...)` for runtime changes (non-null assertion where the instance exists); keep the instance alive across setting changes.

### Naming

Example components are named `AppComponent` (not `ExampleNComponent` or feature-specific names).

## Rules

- All data transformation and validation lives in `handsontable/src/`.
- npm scripts use Node.js `.mjs` helpers; keep bash-specific syntax (`if [ ]`, `mv`, `&&` with `||`) out of `package.json` script entries.
