---
title: StateManager
metaTitle: StateManager - Plugin - Handsontable Documentation
permalink: /10.0/api/state-manager
canonicalUrl: /api/state-manager
hotPlugin: true
editLink: false
---

# StateManager

[[toc]]

## Description

The state manager is a source of truth for nested headers configuration.
The state generation process is divided into three stages.

  +---------------------+  1. User-defined configuration normalization;
  │                     │  The source settings class normalizes and shares API for
  │   SourceSettings    │  raw settings passed by the developer. It is only consumed by
  │                     │  the header tree module.
  +---------------------+
            │
           \│/
  +---------------------+  2. Building a tree structure for validation and easier node manipulation;
  │                     │  The header tree generates a tree based on source settings for future
  │     HeadersTree     │  node manipulation (such as collapsible columns feature). While generating a tree
  │                     │  the source settings is checked to see if the configuration has overlapping headers.
  +---------------------+  If `true` the colspan matrix generation is skipped, overlapped headers are not supported.
            │
           \│/
  +---------------------+  3. Matrix generation;
  │                     │  Based on built trees the matrix generation is performed. That part of code
  │  matrix generation  │  generates an array structure similar to normalized data from the SourceSettings
  │                     │  but with the difference that this structure contains column settings which changed
  +---------------------+  during runtime (after the tree manipulation) e.q after collapse or expand column.
                           That settings describes how the TH element should be modified (colspan attribute,
                           CSS classes, etc) for a specific column and layer level.



