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
 */

/**
 * The entry a transform hands to `ctx.report()`. The runner fills in `file`, `guideUrl`, and the part's
 * line offset.
 *
 * @typedef {object} ReportInput
 * @property {string} ruleId Id of the rule that produced the entry.
 * @property {Severity} severity Entry severity.
 * @property {number} [line] One-based line inside the part's own source.
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
 * @property {string|null} guideUrl Link to the guide section for this rule, or `null`.
 * @property {boolean} safe Whether the rewrite is mechanical and needs no review.
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
 * @property {(target: object, ruleId: string, text: string) => boolean} todo Leave a
 * `TODO(handsontable-codemod <ruleId>): <text>` comment before `target` (a js AST node or path, or a postcss
 * node) unless that exact comment is already there, and add a `manual` report entry. Returns whether a comment
 * was inserted. Files that cannot hold comments (`json`) get the report entry only.
 * @property {Set<string>} facts Set shared across the whole run, phase 1 and phase 2. A transform adds a
 * fact (for example `uses-formulas`) for a later phase to read. Names are lowercase kebab-case, optionally
 * `name:value`.
 * @property {{aggressive: boolean, dryRun: boolean}} options Run options. A transform must not write to
 * disk, so `dryRun` is for reporting only.
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
 */

/**
 * One independently transformable piece of a file. A `.vue` file has several.
 *
 * @typedef {object} Part
 * @property {FileKind} fileKind Kind of this part.
 * @property {string} source Text of this part.
 * @property {object} root Parsed form of this part.
 * @property {object|null} j The jscodeshift API for `js` parts, otherwise `null`.
 * @property {number} lineOffset Zero-based line of the part inside the file, added to reported lines.
 * @property {boolean} changed Set by `ctx.markChanged()`.
 */

/**
 * What an adapter's `parse` returns.
 *
 * @typedef {object} ParseHandle
 * @property {Part[]} parts The parts to transform.
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
 * @property {(source: string, filePath: string) => ParseHandle} parse Parse once.
 * @property {(handle: ParseHandle, source: string) => string} print Print the whole file from the handle.
 * It is called only when a part changed.
 */

export {};
