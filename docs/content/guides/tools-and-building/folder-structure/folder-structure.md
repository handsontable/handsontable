---
id: 9xuz0x0c
title: Folder structure
metaTitle: Folder structure - JavaScript Data Grid | Handsontable
description: The folder structure of Handsontable's code repository.
permalink: /folder-structure
canonicalUrl: /folder-structure
tags:
  - directory
  - repository
  - file tree
  - file structure
  - folders
  - files
react:
  id: 29dbr0lt
  metaTitle: Folder structure - React Data Grid | Handsontable
searchCategory: Guides
category: Tools and building
---

# Folder structure

Handsontable's source files are stored on GitHub, in a monorepo.

[[toc]]

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
├── visual-tests                            # Automated visual regression tests
└── wrappers                                # Wrapper files
    ├── angular                             # Wrapper for Angular
    ├── react                               # Wrapper for React
    ├── react-wrapper                       # Wrapper for React (functional components)
    └── vue                                 # Wrapper for Vue 2
    └── vue3                                # Wrapper for Vue 3
```
