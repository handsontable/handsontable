---
title: Folder structure
metaTitle: Folder structure - Guide - Handsontable Documentation
<<<<<<<< HEAD:docs/next/guides/tools-and-building/folder-structure.md
permalink: /next/folder-structure
========
permalink: /folder-structure
>>>>>>>> 5339b6e2e1b24a598d801411c23ee5e3d5617069:docs/content/guides/tools-and-building/folder-structure.md
canonicalUrl: /folder-structure
tags:
  - directory
  - repository
  - file tree
  - file structure
  - folders
  - files
---

# Folder structure

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
