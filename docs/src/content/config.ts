/**
 * Astro content collection schema.
 *
 * Uses the Astro 5 glob loader with an absolute base path pointing directly at
 * docs/content/, so no src/content/docs symlink is needed. The pattern is
 * restricted to .md/.mdx files so Vite never tries to resolve the React/
 * Handsontable imports inside the code-example .tsx/.jsx snippets.
 *
 * VuePress-specific frontmatter fields are accepted via the schema extension so
 * existing .md files validate without modification.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: glob({
      // Absolute URL → resolves to docs/content/ regardless of Astro srcDir.
      base: new URL('../../content', import.meta.url),
      // Only process markdown files — ignore the .tsx/.jsx code-example snippets.
      pattern: ['**/[^_]*.md', '**/[^_]*.mdx'],
    }),
    schema: docsSchema({
      extend: z.object({
        /** VuePress unique page ID — coerced to string (some pages use numeric IDs). */
        id: z.coerce.string().optional(),

        /** Browser <title> override — ignored by Starlight in Phase 1. */
        metaTitle: z.string().optional(),

        /** VuePress permalink — Starlight derives URLs from file paths. */
        permalink: z.string().optional(),

        /** Canonical URL hint — implement via Starlight <Head> component. */
        canonicalUrl: z.string().optional(),

        /** Algolia search category facet. */
        searchCategory: z.string().optional(),

        /** Sidebar category label. */
        category: z.string().optional(),

        /** Marks a page as a plugin API reference. */
        hotPlugin: z.boolean().optional(),

        /** Framework-specific frontmatter overrides (Phase 3). */
        react: z.record(z.unknown()).optional(),
        angular: z.record(z.unknown()).optional(),
        vue3: z.record(z.unknown()).optional(),

        /** Sidebar badge label (e.g. "Updated", "New"). */
        menuTag: z.string().optional(),
      }),
    }),
  }),
};
