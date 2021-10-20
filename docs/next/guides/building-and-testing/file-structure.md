---
title: File structure
metaTitle: File structure - Guide - Handsontable Documentation
permalink: /next/file-structure
canonicalUrl: /file-structure
tags:
  - directory
  - repository
  - file tree
  - folders
  - files
---

# File structure

Handsontable's source files are stored on GitHub, in a [mono repository](https://github.com/handsontable/handsontable).

```bash
├── .changelogs                             # Temporary changelog entries
├── .codesandbox                            # CodeSandbox configuration
├── .github                                 # GitHub special files
├── bin                                     # Binary files
├── docs                                    # Documentation files
├── examples                                # Code examples
└── handsontable                            # Handsontable project directory
    ├── .config                             # Configuration files
    ├── dist                                # Compiled files
    ├── languages                           # Translations (i18n)
    ├── scripts                             # Handsontable scripts
    ├── src                                 # Source files
    ├── test                                # Automated tests
    ├── .eslintignore                       # Handsontable ESLint ignore list
    ├── .eslintrc.js                        # Handsontable ESLint configuration
    ├── .gitignore                          # Handsontable Git ignore list
    ├── .stylelintignore                    # Stylelint ignore list
    ├── README.md                           # Handsontable README.md
    ├── babel.config.js                     # Handsontable Babel configuration
    ├── base.d.ts                           # Base TypeScript definitions file
    ├── handsontable.d.ts                   # Handsontable TypeScript definitions file
    ├── jest.config.js                      # Jest configuration
    ├── package.json                        # Handsontable package.json
    ├── stylelint.config.js                 # Stylelint configuration
    ├── webpack.config.js                   # webpack configuration
├── resources                               # Static files for README.md
├── scripts                                 # Monorepo scripts
└── wrappers                                # Wrapper files
    ├── angular                             # Wrapper for Angular
    ├── react                               # Wrapper for React
    └── vue                                 # Wrapper for Vue 2
├── .editorconfig                           # EditorConfig configuration
├── .eslintignore                           # Monorepo ESLint ignore list
├── .eslintrc.js                            # Monorepo ESLint configuration
├── .gitattributes                          # Git line ending configuration
├── .gitignore                              # Monorepo Git ignore list
├── .npmrc                                  # npm configuration
├── .nvmrc                                  # nvm configuration
├── CHANGELOG.md                            # Changelog
├── CODE_OF_CONDUCT.md                      # Our code of conduct
├── CONTRIBUTING.md                         # Contributing guide
├── LICENSE.txt                             # License text
├── README.md                               # Monorepo README.md
├── babel.config.js                         # Monorepo Babel configuration
├── handsontable-general-terms.pdf          # General license terms
├── handsontable-non-commercial-license.pdf # Non-commercial license terms
├── hot.config.js                           # Handsontable configuration
├── package.lock.json                       # Monorepo package.lock.json
├── package.json                            # Monorepo package.json
└── sonar-project.properties                # SonarScanner configuration
```