---
title: Migrating from 11.1 to 12.0
metaTitle: Migrating from 11.1 to 12.0 - Guide - Handsontable Documentation
permalink: /next/migration-from-11.1-to-12.0
canonicalUrl: /migration-from-11.1-to-12.0
pageClass: migration-guide
---

# Migrating from 11.1 to 12.0

[[toc]]

To upgrade your Handsontable version from 11.x.x to 12.x.x, follow this guide.

## Step 1: Verifying your `updateSettings` calls that no longer reset the state

Starting from the version 12.0.0, calling the method [`updateSettings`](@/api/core.md#updateSettings) with the `data` property no longer resets resets the cell meta cache and index mapper configuration. If your application relied on resetting that information, you will need to make the following change in your app.

TBD - explain how framework wrappers are affected

TBD - present how to modify the app if someone relied on resetting the state

TBD - in fact, most of the information from https://github.com/handsontable/handsontable/pull/9121#issuecomment-1015325860 can be added here

