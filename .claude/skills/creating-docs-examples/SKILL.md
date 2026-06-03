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
    example1.vue             # TypeScript SFC (`<script setup lang="ts">`)
```

## Key Rules

- **25-60 lines per example.** Keep examples focused and scannable.
- **One concept per example.** Use progressive numbering for complexity: `example1` = basic setup, `example2` = a configuration variation, `example3` = advanced usage.
- **TypeScript is primary.** Always write the `.ts` / `.tsx` file first for JavaScript and React examples. From `docs/`, generate the JS variant with: `npm run docs:code-examples:generate-js -- <path-to-ts-file>` (path relative to `docs/`). Never hand-edit generated JS files. For Vue, write TypeScript inside the `.vue` file with `<script setup lang="ts">` — there is no separate JS variant to generate.
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
- All components must be **standalone** (`standalone: true`, `imports: [HotTableModule]`).
- Use `app.config.ts` (not `app.module.ts`) with `ApplicationConfig`, `provideZoneChangeDetection({ eventCoalescing: true })`, and global `HOT_GLOBAL_CONFIG` for the license key.
- Do **not** add `licenseKey` to individual `<hot-table>` bindings -- it is set globally in `app.config.ts`.
- Template control flow: use `@if` / `@for (x of list; track x.id)` -- never `*ngIf` / `*ngFor`.
- Name the component class `AppComponent` in every example.

**Critical Angular JIT restrictions** — the docs site bootstraps Angular examples with JIT in the browser. JIT cannot load external files at runtime:

- ❌ **Never use `styleUrls`** in standalone components. CSS is injected globally by the example-runner via the `--css` slot. If you need component-scoped styles, use inline `styles: ['...']`.
- ❌ **Never use `templateUrl`**. Always define the component's template inline with `template: \`...\``. The `angular/example1.html` file is the **outer wrapper** (selector tag) consumed by the example-runner -- it is not the component's template.
- ❌ **Never inject services via the constructor**. Use `inject()` instead. JIT mode lacks TypeScript decorator metadata, so constructor DI throws `NG0202`.
- ❌ **Never bind Handsontable hooks in the template** (`(afterInit)="handler()"`). Put hook functions inside `gridSettings` instead.
- ❌ **Only import symbols you actually use**. Unused imports (e.g., `RowObject`, `ViewChild`, `NgFor`) can cause module resolution errors.

The `.ts` file contains both `app.component.ts` and `app.config.ts` as separate `/* file: ... */` sections within a single file:

```typescript
/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-feature-name',
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class AppComponent {
  readonly data = [...];
  readonly gridSettings: GridSettings = { ... };
}
/* end-file */

/* file: app.config.ts */
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
/* end-file */
```

The `angular/example1.html` file is the outer wrapper (not the component template):
```html
<div>
  <example1-feature-name></example1-feature-name>
</div>
```

**Edit on StackBlitz:** When you use **Edit on StackBlitz**, `docs/public/example-tabs.js` merges each framework's companion `example*.html` into the generated app shell. `parseDocsExampleHtmlForStackBlitz` uses the browser `DOMParser` to collect `style` nodes for `<head>` and drop `script` nodes from the body fragment. `mergeCompanionHtmlForStackBlitz` wires that into the StackBlitz template. Examples with no HTML tab keep the previous default mount markup.

See skill `angular-wrapper-dev` for the full reference.

**Vue 3:**

Write every new or updated Vue example as a **TypeScript Single-File Component (`.vue`)** using the **Composition API** and **`<script setup lang="ts">`**. The docs example-runner loads `vue/example*.vue` modules and mounts them with `createApp()` (see `docs/src/scripts/example-runner.ts`).

- ✅ **Do:** one `exampleN.vue` file per example, with `<script setup lang="ts">`.
- ❌ **Do not:** use plain `<script setup>` without `lang="ts"`.
- ❌ **Do not:** split logic into `exampleN.js` + `exampleN.html` (legacy pattern). When you touch an old split example, migrate it to a `.vue` SFC.
- ❌ **Do not:** use the Options API (`defineComponent` with `data()`, `methods`, etc.) in new examples.

**SFC skeleton:**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['Acme Corp', 'Q1 2025', '$4.2M'],
    ['Vertex Industries', 'Q1 2025', '$18.7M'],
  ],
  colHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>
```

**Vue-specific rules:**

- Always use `<script setup lang="ts">`. Type grid options with `GridSettings` from `handsontable/settings`. Add local `type` aliases for row or domain data when the example uses object rows.
- Call `registerAllModules()` once at the top level of `<script setup>` (not inside `onMounted`).
- Import `HotTable` and `HotColumn` from `@handsontable/vue3`. Register them by using them in `<template>` (no global `app.component()` registration).
- Put `licenseKey: 'non-commercial-and-evaluation'` inside the settings object passed to `HotTable`.
- The root `<div>` in `<template>` must use an `id` that matches the example container in the guide (`#example1` in `::: example #example1 :vue3`).
- Prefer a single `:settings` object for grid options. Use individual props only when the guide text highlights a specific prop.
- Put Handsontable hooks (`afterChange`, `beforeDataProviderFetch`, etc.) inside the settings object, not as Vue event listeners on `<HotTable>`.
- Use `ref()` from `vue` for reactive state that the template or handlers update. Use a plain `const` for `hotSettings` when reactive deep updates would trigger unwanted `updateSettings()` calls (for example, when only a status label changes beside the grid).
- Access the underlying instance with a template ref when needed: `const hotRef = ref(null)` and `<HotTable ref="hotRef" :settings="hotSettings" />`, then `hotRef.value?.hotInstance`.
- For `HotColumn`, nest it inside `<HotTable>` in `<template>` and pass column options via `:settings` on each `HotColumn`.
- Optional `<style scoped>` is allowed for example-only UI (buttons, status text). Example-runner CSS from the guide's `--css` slot still applies globally.

**Presets** on the `::: example` directive select dependencies: `:vue3` (default), `:vue3-languages`, `:vue3-vuex`. Match the preset to the feature the page demonstrates.

**Embedding a Vue SFC** (single tab, no `--html` / `--js`):

```markdown
::: example #example1 :vue3

@[code](@/content/guides/category/feature/vue/example1.vue)

:::
```

See skill `vue-wrapper-dev` for wrapper behavior (`HotTable`, `HotColumn`, settings propagation).

## Embedding in the Guide

After creating example files, embed them in the guide's `.md` file using the `@[code]` directive inside an `::: example` container. See the `writing-docs-pages` skill for the full embedding syntax.

## Checklist

- [ ] TypeScript source written and tested (`.ts`/`.tsx`, or Vue `.vue` with `lang="ts"`).
- [ ] JS variant generated for JavaScript/React examples (not hand-written). Vue examples have no JS variant.
- [ ] `licenseKey: 'non-commercial-and-evaluation'` present.
- [ ] Imports use `handsontable/base` + registration pattern.
- [ ] Example stays within 25-60 lines.
- [ ] One concept per example with realistic data.
- [ ] Vue examples use `.vue` SFC with `<script setup lang="ts">` and Composition API (no split `.js`/`.html`, no Options API).
