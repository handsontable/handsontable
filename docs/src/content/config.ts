/**
 * Astro content collection schema.
 *
 * Extends Starlight's docsSchema with VuePress-specific frontmatter fields so
 * that existing .md files validate without modification.
 *
 * Fields not used by Starlight (e.g. id, permalink, react, angular) are
 * accepted and ignored by the renderer. They can be removed from individual
 * pages gradually during the migration.
 */
import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    schema: docsSchema({
      extend: z.object({
        /** VuePress unique page ID — not used by Starlight. */
        id: z.string().optional(),

        /** Browser <title> override — use Starlight's head injection instead. */
        metaTitle: z.string().optional(),

        /** VuePress permalink — Starlight derives URLs from file paths. */
        permalink: z.string().optional(),

        /** Canonical URL hint — implement via Starlight <Head> component. */
        canonicalUrl: z.string().optional(),

        /** Algolia search category facet. */
        searchCategory: z.string().optional(),

        /** Sidebar category label (used by some sidebar builders). */
        category: z.string().optional(),

        /** Marks a page as a plugin API reference. */
        hotPlugin: z.boolean().optional(),

        /**
         * Framework-specific frontmatter overrides.
         * Consumed in Phase 3 when per-framework builds are restored.
         */
        react: z.record(z.unknown()).optional(),
        angular: z.record(z.unknown()).optional(),
        vue3: z.record(z.unknown()).optional(),

        /** Sidebar badge label (e.g. "Updated", "New"). */
        menuTag: z.string().optional(),
      }),
    }),
  }),
};
