/**
 * Astro content collection schema.
 *
 * Uses a custom framework-loader that reads all .md files from docs/content/
 * and creates 4 entries per file — one per framework (JavaScript, React,
 * Angular, Vue). The loader applies per-framework only-for content filtering and
 * all other VuePress preprocessing at load time.
 *
 * Entry IDs follow the pattern: {framework-prefix}/{slug}
 * e.g. react-data-grid/guides/getting-started/introduction
 *
 * VuePress-specific frontmatter fields are accepted via the schema extension so
 * existing .md files validate without modification.
 */
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsSchema } from '@astrojs/starlight/schema';
import { fileURLToPath } from 'url';
import { frameworkLoader } from './plugins/framework-loader.mjs';

export const collections = {
  docs: defineCollection({
    loader: frameworkLoader({
      contentDir: fileURLToPath(new URL('../content', import.meta.url)),
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
        react: z.record(z.string(), z.unknown()).optional(),
        angular: z.record(z.string(), z.unknown()).optional(),
        vue3: z.record(z.string(), z.unknown()).optional(),

        /** Sidebar badge label (e.g. "Updated", "New"). */
        menuTag: z.string().optional(),
      }),
    }),
  }),
};
