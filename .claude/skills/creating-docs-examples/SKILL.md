---
name: creating-docs-examples
path: docs/**
description: Use when creating code examples for documentation pages - JavaScript, TypeScript, React, Angular, and Vue variants with proper imports, registration, and license key
---

# Creating Documentation Code Examples

This skill covers how to write runnable code examples that are embedded in documentation guide pages.

## File Structure

Each guide has framework-specific subdirectories for its examples:

```
docs/content/guides/category/feature/
  feature.md                 # The guide page
  javascript/                # JS examples
    example1.js              # Generated from TS - do not edit directly
    example1.ts              # Primary source - edit this first
  react/                     # React variants
    example1.jsx             # Generated from TSX
    example1.tsx             # Primary source
  angular/                   # Angular variants
    example1.ts
    example1.html            # Template file
  vue/                       # Vue 3 variants
    example1.js
    example1.html            # Template file
```

## Key Rules

- **25-60 lines per example.** Keep examples focused and scannable.
- **One concept per example.** Use progressive numbering for complexity: `example1` = basic setup, `example2` = a configuration variation, `example3` = advanced usage.
- **TypeScript is primary.** Always write the `.ts` / `.tsx` file first. From `docs/`, generate the JS variant with: `npm run docs:code-examples:generate-js -- <path-to-ts-file>` (path relative to `docs/`). Never hand-edit generated JS files.
- **Use realistic data.** Prefer `createSpreadsheetData()` or domain-appropriate sample data (product names, dates, currencies). Avoid trivial arrays like `[1, 2, 3]`.

## Required Elements in Every Example

1. **Imports** - use the base import and explicit registration:
   ```js
   import Handsontable from 'handsontable/base';
   import { registerAllModules } from 'handsontable/registry';
   registerAllModules();
   ```
   For examples that demonstrate tree-shaking, import individual plugins and cell types instead of `registerAllModules()`.

2. **License key** - always include:
   ```js
   licenseKey: 'non-commercial-and-evaluation'
   ```

3. **Container element** - target the conventional `#example` div:
   ```js
   const container = document.querySelector('#example');
   ```

## Framework-Specific Patterns

**React (TSX/JSX):**
```tsx
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
registerAllModules();

const App = () => {
  return <HotTable data={data} licenseKey="non-commercial-and-evaluation" />;
};
```

**Angular:**
- Component logic goes in the `.ts` file; template markup goes in the `.html` file using `<hot-table>`.
- All components must be **standalone** (`standalone: true`, `imports: [HotTableModule]`).
- Use `app.config.ts` (not `app.module.ts`) with `ApplicationConfig`, `provideZoneChangeDetection({ eventCoalescing: true })`, and global `HOT_GLOBAL_CONFIG` for the license key.
- Do **not** add `licenseKey` to individual `<hot-table>` bindings -- it is set globally in `app.config.ts`.
- Template control flow: use `@if` / `@for (x of list; track x.id)` -- never `*ngIf` / `*ngFor`.
- Row data type: use `RowObject[]` from `handsontable/common`, not `any[]`.
- Name the component class `AppComponent` in every example.

`app.config.ts` template:
```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig },
  ],
};
```

Component template:
```typescript
import { Component } from '@angular/core';
import { HotTableModule } from '@handsontable/angular-wrapper';
import { RowObject } from 'handsontable/common';

@Component({
  selector: 'app-example1',
  standalone: true,
  imports: [HotTableModule],
  templateUrl: './example1.html',
})
export class AppComponent {
  hotData: RowObject[] = [];
}
```

See skill `angular-wrapper-dev` for the full reference.

**Vue 3:**
- Component logic goes in the `.js` file.
- Template markup goes in the `.html` file using `<hot-table>`.

## Embedding in the Guide

After creating example files, embed them in the guide's `.md` file using the `@[code]` directive inside an `::: example` container. See the `writing-docs-pages` skill for the full embedding syntax.

## Checklist

- [ ] TypeScript source written and tested.
- [ ] JS variant generated (not hand-written).
- [ ] `licenseKey: 'non-commercial-and-evaluation'` present.
- [ ] Imports use `handsontable/base` + registration pattern.
- [ ] Example stays within 25-60 lines.
- [ ] One concept per example with realistic data.
