---
name: creating-docs-examples
path: docs/**
description: Use when creating code examples for documentation pages - JavaScript, TypeScript, React, Angular, and Vue variants with proper imports, registration, and license key
---

# Creating Documentation Code Examples

## File structure

```
docs/content/guides/category/feature/
  feature.md                 # The guide page
  javascript/example1.ts     # Primary source; example1.js is generated
  react/example1.tsx         # Primary source; example1.jsx is generated
  angular/example1.ts        # plus example1.html (outer wrapper)
  vue/example1.vue           # TypeScript SFC (`<script setup lang="ts">`)
```

## Rules

- 25-60 lines per example, one concept each. Number by complexity: `example1` basic setup, `example2` a configuration variation, `example3` advanced.
- Write the `.ts` / `.tsx` file first. From `docs/`, generate the JS variant with `npm run docs:code-examples:generate-js -- <path-to-ts-file>` (path relative to `docs/`); generated JS files are overwritten, so change the TS source. Vue has no JS variant.
- Use `createSpreadsheetData()` or domain-appropriate data (product names, dates, currencies).

## Required in every example

1. Base import and explicit registration (tree-shaking examples import individual plugins and cell types instead of `registerAllModules()`):
   ```js
   import Handsontable from 'handsontable/base';
   import { registerAllModules } from 'handsontable/registry';
   registerAllModules();
   ```
2. `licenseKey: 'non-commercial-and-evaluation'`
3. Container: `const container = document.querySelector('#example');`

## React (TSX/JSX)

```tsx
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
registerAllModules();

const App = () => {
  return <HotTable data={data} licenseKey="non-commercial-and-evaluation" />;
};
```

## Angular

- Standalone components (`standalone: true`, `imports: [HotTableModule]`), class named `AppComponent` in every example.
- `app.config.ts` (not `app.module.ts`) with `ApplicationConfig`, `provideZoneChangeDetection({ eventCoalescing: true })`, and global `HOT_GLOBAL_CONFIG` for the license key. Set the license there only; leave `licenseKey` off individual `<hot-table>` bindings.
- Template control flow: `@if` / `@for (x of list; track x.id)`.

The docs site bootstraps Angular examples with JIT in the browser, which cannot load external files and lacks decorator metadata:

- Inline styles: `styles: ['...']`. The example-runner injects CSS globally via the `--css` slot, and `styleUrls` fails.
- Inline template: `template: \`...\``. `angular/example1.html` is the outer wrapper (selector tag) the example-runner consumes, not the component template; `templateUrl` fails.
- Inject services with `inject()`. Constructor DI throws `NG0202`.
- Put Handsontable hook functions inside `gridSettings`, not as template bindings (`(afterInit)="handler()"`).
- Import only the symbols you use; unused imports (`RowObject`, `ViewChild`, `NgFor`) can cause module resolution errors.

The `.ts` file holds `app.component.ts` and `app.config.ts` as separate `/* file: ... */` sections:

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

`angular/example1.html`:
```html
<div>
  <example1-feature-name></example1-feature-name>
</div>
```

Edit on StackBlitz: `docs/public/example-tabs.js` merges each framework's companion `example*.html` into the generated app shell (`parseDocsExampleHtmlForStackBlitz` uses the browser `DOMParser` to collect `style` nodes for `<head>` and drops `script` nodes from the body fragment; `mergeCompanionHtmlForStackBlitz` wires it into the StackBlitz template). Examples with no HTML tab keep the default mount markup.

See skill `angular-wrapper-dev` for the full reference.

## Vue 3

Write every new or updated example as a TypeScript SFC: one `exampleN.vue` per example, Composition API, `<script setup lang="ts">`. The example-runner (`docs/src/scripts/example-runner.ts`) loads `vue/example*.vue` and mounts them with `createApp()`. When you touch an old split `exampleN.js` + `exampleN.html` example, migrate it to a `.vue` SFC. New examples use the Composition API, not `defineComponent` with `data()`/`methods`.

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

- Type grid options with `GridSettings` from `handsontable/settings`; add local `type` aliases for object rows.
- Call `registerAllModules()` once at the top level of `<script setup>`, outside `onMounted`.
- Import `HotTable` and `HotColumn` from `@handsontable/vue3`; using them in `<template>` registers them (no global `app.component()` registration).
- `licenseKey` goes inside the settings object.
- The root `<div>` `id` matches the guide's example container (`#example1` in `::: example #example1 :vue3`).
- Prefer a single `:settings` object; use individual props only when the guide text highlights one.
- Put hooks (`afterChange`, `beforeDataProviderFetch`, etc.) inside the settings object, not as Vue event listeners on `<HotTable>`.
- `ref()` holds reactive state the template or handlers update. Use a plain `const` for `hotSettings` when deep reactivity would trigger unwanted `updateSettings()` calls (e.g. only a status label changes beside the grid).
- Template refs bound via `ref="..."` use `useTemplateRef('refName')`, never `ref()`, with the string matching the template `ref` attribute exactly:

```vue
const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');   // <HotTable ref="hotRef" :settings="hotSettings" />
const dropdownRef = useTemplateRef<HTMLDivElement>('dropdownRef');         // <div ref="dropdownRef" class="theme-dropdown">
```

Access the grid with `hotRef.value?.hotInstance`, a DOM element with `dropdownRef.value`.
- `HotColumn` nests inside `<HotTable>` in `<template>`, with column options via `:settings` on each.
- `<style scoped>` is allowed for example-only UI; the guide's `--css` slot CSS still applies globally.

Presets on the `::: example` directive select dependencies: `:vue3` (default), `:vue3-languages`, `:vue3-vuex`. Match the preset to the feature.

Embedding a Vue SFC (single tab, no `--html` / `--js`):

```markdown
::: example #example1 :vue3

@[code](@/content/guides/category/feature/vue/example1.vue)

:::
```

See skill `vue-wrapper-dev` for wrapper behavior.

## Embedding in the guide

Embed the files with `@[code]` inside an `::: example` container; syntax in the `writing-docs-pages` skill.

## Checklist

- [ ] TypeScript source written (`.ts`/`.tsx`, or `.vue` with `lang="ts"`); JS variant generated, not hand-written.
- [ ] `licenseKey: 'non-commercial-and-evaluation'`, `handsontable/base` import plus registration.
- [ ] 25-60 lines, one concept, realistic data.
- [ ] Every framework variant rendered and looked at: open the page in the docs dev server (`npm --prefix docs run dev`, not a full docs build) and check each variant for console load errors, grid width, and styling. A variant you did not open counts as untested.
- [ ] Angular variants type-check: `SKIP_LATEST=1 npm run typecheck --prefix docs/angular-type-check` (as CI runs it; without `SKIP_LATEST` it also checks against `handsontable@latest`, so an API added on the branch fails locally) (needs `handsontable` and `wrappers/angular-wrapper` built first). This is the `Docs Angular Type Check` CI job, which fails most often after an example edit.
