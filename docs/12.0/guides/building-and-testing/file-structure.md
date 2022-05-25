---
title: File structure
metaTitle: File structure - Guide - Handsontable Documentation
permalink: /12.0/file-structure
canonicalUrl: /file-structure
tags:
  - directory
  - repository
  - file tree
  - folders
  - files
---

# File structure

Handsontable's source files are stored on GitHub, in a mono repository.

```bash
├── bin                                     # Binary files
├── docs                                    # Documentation files
├── examples                                # Code examples
└── handsontable                            # Handsontable project directory
    ├── dist                                # Compiled files
    ├── languages                           # Translations (i18n)
    ├── scripts                             # Handsontable scripts
    ├── src                                 # Source files
    ├── test                                # Automated tests
    └── types                               # Handsontable TypeScript definitions files
├── resources                               # Static files for README.md
├── scripts                                 # Monorepo scripts
└── wrappers                                # Wrapper files
    ├── angular                             # Wrapper for Angular
    ├── react                               # Wrapper for React
    └── vue                                 # Wrapper for Vue 2
    └── vue3                                # Wrapper for Vue 3
```