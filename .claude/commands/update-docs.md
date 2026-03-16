A new option/method was added: `$ARGUMENTS`.

1. Locate and update its JSDoc in source:
   - plugin/core code in `/handsontable/src/**`
   - option docs in `/handsontable/src/dataMap/metaManager/metaSchema.js` (if it is a config option).
2. Update docs content in this repository:
   - update `/docs/content/api/plugins.md` if a new plugin was added
   - update relevant guides in `/docs/content/guides/**` when user-facing behavior changed.
3. Check migration docs in `/docs/content/guides/upgrade-and-migration/**` only when the change is breaking or deprecates behavior.
4. Update TypeScript definitions in `/handsontable/types/` (usually `/handsontable/types/settings.d.ts` for options).
5. Keep wording short, active voice, and American English.
