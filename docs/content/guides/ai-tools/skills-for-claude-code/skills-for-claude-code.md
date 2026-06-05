---
type: explanation
id: ai1m9n3t
title: Skills for Claude Code
metaTitle: Skills for Claude Code - JavaScript Data Grid | Handsontable
description: Reusable instructions that teach the Claude coding agent how to work with Handsontable, covering plugin development, cell editors, tests, and documentation examples.
permalink: /skills-for-claude-code
react:
  id: ai5g8h6w
  metaTitle: Skills for Claude Code - React Data Grid | Handsontable
angular:
  id: ai7e4u2x
  metaTitle: Skills for Claude Code - Angular Data Grid | Handsontable
vue:
  id: ai0a5c1l
  metaTitle: Skills for Claude Code - Vue Data Grid | Handsontable
searchCategory: Guides
category: AI Tools
menuTag: new
---
Skills for Claude Code are bundled instructions that give Claude deep knowledge of Handsontable and HyperFormula. Install them once, then ask Claude to build, configure, or debug -- it pulls from the same product docs you're reading right now, so the code it writes matches current APIs instead of guessing from outdated training data.

## Two skills, one install

The <a href="https://github.com/handsontable/handsontable-skills" target="_blank" rel="noopener noreferrer">repo</a> ships two skills:

- **handsontable** -- the data grid component. Covers React, Angular, Vue, and vanilla JS setup, configuration, theming, cell types, sorting, filtering, formulas, hooks, performance, and v17 migration.
- **hyperformula** -- the headless calculation engine. Covers instance creation, CRUD, custom functions, named expressions, error handling, batch operations, and Node.js usage.

Use **handsontable** when you're building a visible grid in a web app. Use **hyperformula** when you're evaluating formulas programmatically without a UI -- server-side calculations, pricing engines, what-if analysis. Claude loads whichever is relevant based on what you ask.

## Install with one command

In Claude Code, add the marketplace and install both skills:

```bash
/plugin marketplace add handsontable/handsontable-skills
/plugin install handsontable-skills@handsontable-skills
```

For Cowork or Claude.ai web, download the zip from the latest GitHub release and drag it into chat. For the Claude API, upload the skill folder directly. Full instructions live in the repo README.

## Versioned to match releases

Each skill is tagged to the product version it targets -- `handsontable/v17.0.0` is the skill for Handsontable 17, `hyperformula/v3.2.0` is the skill for HyperFormula 3.2. You always know which API surface Claude is working from.

<a href="https://github.com/handsontable/handsontable-skills" target="_blank" rel="noopener noreferrer">Browse the Skills for Claude Code</a>
