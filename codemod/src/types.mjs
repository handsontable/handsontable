/**
 * Shared type definitions for the codemod. This module has no runtime code: the typedefs below are the
 * contract between the runner, the adapters, and the transforms.
 *
 * @module types
 */

/**
 * What kind of content a file or a part of a file holds. It selects the transforms that may touch it.
 *
 * - `js`: JavaScript or TypeScript source, parsed with jscodeshift.
 * - `css`: CSS or SCSS, parsed with postcss.
 * - `vue`: a whole `.vue` single-file component (its script and style blocks are exposed as `js` and `css`
 *   parts).
 * - `json`: a JSON document, in practice `package.json`.
 * - `template`: an HTML or framework template.
 *
 * @typedef {'js'|'css'|'vue'|'json'|'template'} FileKind
 */

/**
 * @typedef {'changed'|'manual'|'warning'} Severity
 */

/**
 * One line of the migration report.
 *
 * @typedef {object} ReportEntry
 * @property {string} ruleId Rule id, or `parse-error` or `transform-error` for tool failures.
 * @property {Severity} severity `changed` for a rewrite, `manual` for work left to the user, `warning` for a
 * tool problem or a doubtful spot.
 * @property {string} file Project-relative path with forward slashes.
 * @property {number|null} line One-based line in the file, or `null`.
 * @property {string} message What happened or what to do.
 * @property {string|null} guideUrl Link to the migration guide section, or `null`.
 * @property {number[]} [lines] For an entry that stands for several matches in one part: every matching line.
 * `line` is the first of them.
 * @property {'run'} [scope] `run` marks a note that holds for every file. The `Report` keeps it once and lists the
 * files it came from in `files`.
 * @property {string[]} [files] Files a `run` entry applies to. Set by the `Report`.
 */

/**
 * The entry a transform hands to `ctx.report()`. The runner fills in `file`, `guideUrl`, and the part's
 * line offset.
 *
 * @typedef {object} ReportInput
 * @property {string} ruleId Id of the rule that produced the entry.
 * @property {Severity} severity Entry severity.
 * @property {number} [line] One-based line inside the part's own source.
 * @property {number[]} [lines] Every line of a collapsed group of matches, inside the part's own source.
 * @property {'run'} [scope] `run` for a note that is the same in every file (a rule's `note`), so the report shows
 * it once with the list of files.
 * @property {string} [mergeKey] A later entry of the same part with the same key replaces this one instead of adding
 * another, so a change that two migration steps make to one spot is reported once, as the net result.
 * @property {boolean} [todo] `false` keeps a `manual` entry out of the code: no marker is left for it. Without it a
 * `manual` entry in a js or css part gets a `TODO(handsontable-codemod <ruleId>)` comment at its line, unless the
 * rule says `todo: false`.
 * @property {'earliest'|'latest'} [merge] Which entry owns a merged spot. `latest` (the default) lets the later entry
 * replace the earlier one: the net change, as a dependency range bump reports it. `earliest` keeps the first entry,
 * so the rule of the earliest migration keeps its id, message, and guide link: a `detect` rule with a `mergeKey` uses it.
 * @property {string} message What happened or what to do.
 */

/**
 * A manifest rule after loading. Besides the fields the author wrote, the loader adds `version`,
 * `guideUrl`, and, for `custom` rules, `modulePath`. The remaining fields depend on `kind` (see
 * `RULE_KINDS` in `manifest.mjs`).
 *
 * @typedef {object} Rule
 * @property {string} id Stable id, `<version>/<slug>`.
 * @property {string} kind One of the rule kinds.
 * @property {string} version Version of the manifest that owns the rule.
 * @property {string} [guide] Anchor in the migration guide, without the `#`. A TODO comment links to the guide only
 * for a rule that has one.
 * @property {string|null} guideUrl Link to the guide section for this rule, or `null`.
 * @property {boolean} safe `true`: the tool applies the rewrite by default. `false`: the tool never edits code for the
 * rule, it reports `manual` entries and may leave a TODO comment. Required in a manifest, except for `detect` and
 * `exportRemoved` rules, which only report and load as `false`. See `lib/safety.mjs`.
 * @property {'high'|'medium'} [minConfidence] Lowest option-object confidence the rule rewrites at.
 * @property {string} [message] Text for report entries.
 * @property {string} [advice] Text for TODO comments and manual entries.
 * @property {string} [modulePath] Absolute path of the module of a `custom` rule.
 */

/**
 * A loaded manifest.
 *
 * @typedef {object} Manifest
 * @property {string} version Semver, equal to the directory name.
 * @property {'released'|'draft'} status Release state.
 * @property {{url: string, source: string}} guide Public URL and repository path of the migration guide.
 * @property {Rule[]} rules Inline rules followed by the rules of every included file.
 * @property {string} dir Absolute path of the version directory.
 */

/**
 * The rules selected for one run, grouped by version in ascending order.
 *
 * @typedef {object} Plan
 * @property {Array<{version: string, rules: Rule[]}>} versions Selected versions with their rules.
 * @property {Map<string, Rule>} rulesById Every selected rule by id.
 * @property {string} [fromText] The `--from` of the run as text (given or detected). Absent in a plan built without
 * a range, as the fixture tests do.
 */

/**
 * The pnpm catalogs of the workspace file that applies to a `package.json`.
 *
 * @typedef {object} CatalogInfo
 * @property {string} file Project-relative path of the `pnpm-workspace.yaml`.
 * @property {Map<string, Map<string, string>>} catalogs Ranges by catalog name, then package name. The default
 * catalog is `''`.
 */

/**
 * The context handed to `Transform.apply`. One context exists per part of a file: a `.js` file has one
 * part, a `.vue` file has one per script or style block.
 *
 * @typedef {object} Ctx
 * @property {string} filePath Project-relative path with forward slashes. Use it for extension checks and
 * messages, never to read the file.
 * @property {FileKind} fileKind Kind of this part. It is always one of the kinds the transform declared.
 * @property {string} source Original text of this part.
 * @property {object|null} j The jscodeshift API bound to the right parser for this file. `null` unless
 * `fileKind` is `js`.
 * @property {object} root The parsed form of this part, edited in place. `js`: a jscodeshift Collection.
 * `css`: a postcss Root. `json`: the parsed JSON value. Other kinds: whatever the adapter documents.
 * @property {(entry: ReportInput) => void} report Add a report entry. Identical entries collapse.
 * @property {(target: object, ruleId: string, text: string, comment?: string) => boolean} todo Leave a
 * `TODO(handsontable-codemod <ruleId>): <first sentence of text> See <guide link>` comment before `target` (a js
 * AST node or path, or a postcss node) unless that exact comment is already there, and add a `manual` report
 * entry that carries the whole `text`. `comment` replaces `text` as the source of the comment when the caller
 * has a better short form. The link is added only for a rule that has a `guide` anchor. Returns whether a comment
 * was inserted. Files that cannot hold comments (`json`) get the report entry only.
 * @property {(target: object, ruleId: string, text: string) => boolean} comment The comment half of `todo`: leave
 * the TODO comment, with `text` as its source, and add no report entry. A transform whose own entry already carries
 * the advice (a removal) uses it, so the report says it once. Returns whether a comment was inserted.
 * @property {import('./lib/json-edit.mjs').JsonDocument|null} json For a `json` part, the document that edits the
 * text by offset and keeps `root` in step: `setString()` and `addMember()`. `null` for every other kind.
 * @property {import('./lib/css-edit.mjs').CssDocument|null} css For a `css` part, the document that edits the text
 * by offset and keeps `root` in step: `replaceInDeclaration()`, `replaceInAtRule()`, and `insertCommentBefore()`.
 * The printed file is the original text with those edits spliced in, so a transform never prints the postcss
 * root. `null` for every other kind.
 * @property {'scoped'|'module'|null} cssScope For a `css` part of a Vue `<style scoped>` or `<style module>` block,
 * which one it is. `null` for every other part. A rule about a selector that the framework creates at runtime reads it.
 * @property {number} lineOffset Zero-based line of the part inside the file. `report()` adds it to its lines itself;
 * code that records a line elsewhere (a fact) adds it by hand.
 * @property {string} fromText The `--from` of the run as text, or an empty string when the context has no range. A
 * rule that bumps a dependency compares it with the version line of the range it finds.
 * @property {CatalogInfo|null} catalog The pnpm catalogs that apply to this `package.json`, read in phase 2 for a file
 * that holds a `catalog:` spec. `null` for any other part and when no `pnpm-workspace.yaml` lies between the file and
 * the project directory.
 * @property {Set<string>} facts Set shared across the whole run, phase 1 and phase 2. A transform adds a
 * fact (for example `uses-formulas`) for a later phase to read. Names are lowercase kebab-case, optionally
 * `name:value`. Use `addFact()` and `hasFactFor()` from `src/lib/facts.mjs`: they also record the directory
 * the fact came from, as `name@<dir>`, so a monorepo's package.json files do not share facts.
 * @property {{aggressive: boolean, dryRun: boolean, todo: boolean}} options Run options. A transform must not write
 * to disk, so `dryRun` is for reporting only. `todo` is `false` under `--no-todo`: `todo()` and `comment()` then
 * leave no comment. `markers: false` (the unit tests of a transform use it to pin "reports, edits nothing") keeps
 * only the generic marker of a `manual` entry away: `todo()` and `comment()` still write.
 * @property {() => void} markChanged Call after every edit of `root`. A part that never calls it is not
 * printed, so the file keeps its exact original bytes.
 */

/**
 * A transform module. The default export of every file in `src/transforms/` has this shape.
 *
 * `apply` receives the rules of the module's own `kinds` for one version, in manifest order, and runs once
 * per part whose kind is in `fileKinds`. It may return a promise. The runner calls modules in the fixed
 * kind order from `src/transforms/index.mjs`; a module that serves several kinds runs once, at the position
 * of its earliest kind.
 *
 * @typedef {object} Transform
 * @property {string[]} kinds Rule kinds the module handles.
 * @property {FileKind[]} fileKinds File kinds it can edit.
 * @property {(ctx: Ctx, rules: Rule[]) => void|Promise<void>} apply Edit `ctx.root`, call
 * `ctx.markChanged()`, and report.
 * @property {(rule: Rule) => string[]} [validate] Check the fields of one rule of the module's kinds that the manifest
 * validator cannot express, and return the problems (an empty list for a valid rule). The manifest loader calls it,
 * so a malformed rule fails `--list` and the manifest tests with the rule id and the field, and never surfaces as a
 * per-file `transform-error`.
 * @property {{fileKinds: FileKind[], precheck?: RegExp}} [scan] Only for a module whose kinds run in phase 2.
 * In phase 1 the runner also calls `apply`, with the module's rules, on parts of the listed `fileKinds`, so the
 * module can collect facts. The module must not edit in that call. `precheck` replaces the adapter's precheck for
 * that visit, so a file that never names Handsontable can still be scanned. Tell the two calls apart by
 * `ctx.fileKind`: phase 2 visits `package.json` only, so `json` means edit and any other kind means scan.
 */

/**
 * One independently transformable piece of a file. A `.vue` file has several.
 *
 * @typedef {object} Part
 * @property {FileKind} fileKind Kind of this part.
 * @property {string} source Text of this part.
 * @property {object} root Parsed form of this part.
 * @property {import('./lib/json-edit.mjs').JsonDocument} [json] The editor of a `json` part.
 * @property {import('./lib/css-edit.mjs').CssDocument} [document] The editor of a `css` part.
 * @property {object|null} j The jscodeshift API for `js` parts, otherwise `null`.
 * @property {number} lineOffset Zero-based line of the part inside the file, added to reported lines.
 * @property {boolean} [scoped] `true` for a Vue `<style scoped>` block. Set by the Vue adapter on `css` parts.
 * @property {boolean} [module] `true` for a Vue `<style module>` block. Set by the Vue adapter on `css` parts.
 * @property {number} [start] Offset of the part's text inside the file. Set by the Vue adapter.
 * @property {number} [end] Offset where the part's text ends inside the file. Set by the Vue adapter.
 * @property {boolean} changed Set by `ctx.markChanged()`.
 * @property {import('./lib/carrier.mjs').MarkerCarriers} [carriers] The array elements of a `js` part whose markers
 * `printJsPart()` splices in as text. Set by `applyMarkers()`.
 */

/**
 * What an adapter's `parse` returns.
 *
 * @typedef {object} ParseHandle
 * @property {Part[]} parts The parts to transform.
 * @property {Array<{type: string, lang: string|null, line: number, src: boolean, relevant: boolean}>} [skippedBlocks]
 * Blocks of the file the adapter has no part for (a Vue `<style lang="less">`, any `src=` block). The runner reports
 * the `relevant` ones as `skipped-file` warnings.
 */

/**
 * Turns a file into parts and back.
 *
 * @typedef {object} Adapter
 * @property {FileKind} fileKind Kind of the whole file.
 * @property {FileKind[]} fileKinds Every kind its parts can have.
 * @property {string[]} extensions Lowercase extensions with the dot.
 * @property {boolean} implemented `false` for a stub. The runner skips files of an unimplemented adapter.
 * @property {RegExp} precheck Cheap test on the raw source. A file that does not match is never parsed.
 * @property {string} [skipReason] Set by an adapter that never parses: a file that passes `precheck` becomes one
 * `skipped-file` warning with this text, and nothing else runs on it.
 * @property {(source: string) => Array<{line: number, message: string}>} [skipNotes] Code in the file that the adapter
 * cannot analyze, as `skipped-file` warnings (an HTML page's inline scripts).
 * @property {(source: string, filePath: string) => ParseHandle} parse Parse once.
 * @property {(handle: ParseHandle, source: string) => string} print Print the whole file from the handle.
 * It is called only when a part changed.
 */

export {};
