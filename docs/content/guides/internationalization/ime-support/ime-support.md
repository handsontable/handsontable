---
id: bhst4cl4
title: IME support
metaTitle: IME support - JavaScript Data Grid | Handsontable
description: Convert keystrokes to characters not available on the keyboard, using the Input Method Editor. This feature is always enabled and available for cell editors.
permalink: /ime-support
canonicalUrl: /ime-support
tags:
  - input method editor
  - korean
  - japanese
  - chinese
  - latin
react:
  id: 8pqhhu5r
  metaTitle: IME support - React Data Grid | Handsontable
angular:
  id: 7u4izjbt
  metaTitle: IME support - Angular Data Grid | Handsontable
searchCategory: Guides
category: Internationalization
---

# IME support

Convert keystrokes to characters not available on the keyboard, using the Input Method Editor. This feature is always enabled and available for cell editors.

[[toc]]

## What is IME

An Input Method Editor (IME) is a component of the operating system (OS) that enables users to generate characters not natively available on their keyboard. It converts sequences of keystrokes or mouse interactions into characters from other alphabets or scripts. For example, when typing Chinese characters using a Latin keyboard, the IME allows users to compose the desired characters based on phonetic or symbolic input.

## IME support in Handsontable

Handsontable supports IME (Input Method Editor) input through the same mechanisms provided by the operating system. When you switch your input source to a language that requires IME (such as Korean, Japanese, or Chinese), you can use it in cell editors just like in any standard text field.

By default, IME support works when editing a cell through the standard edit mode (for example, pressing Enter, F2, or double-clicking a cell).
If you want to start typing immediately into a selected cell without explicitly opening the editor, you need to enable the imeFastEdit option.

## The [`imeFastEdit`](@/api/options.md#imefastedit) option

Handsontable includes a configuration option called imeFastEdit, which controls how IME users interact with the fast edit feature.
- Default value: false
- Type: boolean

When imeFastEdit is disabled (default), IME users start editing a cell only after explicitly activating the editor (e.g., pressing Enter, F2, or double-clicking the cell).
When imeFastEdit is enabled, users can start editing immediately by typing directly into the selected cell.

<div class="custom-block tip"><p class="custom-block-title">TIP</p> <p><strong>Note:</strong> Enabling imeFastEdit can improve input speed for some IME users but may conflict with certain accessibility tools.</p></div>

## Known limitations
- Accessibility impact:
Enabling [`imeFastEdit`](@/api/options.md#imefastedit) can interfere with how some screen readers interpret and read table cells. If accessibility support is a priority, keep imeFastEdit disabled.
- Browser and OS dependency:
IME behavior depends on the user’s operating system, browser, and keyboard configuration. Visual placement of the IME popup or candidate window may vary across environments.

## Test IME support

To test the IME support, you will need to change your language preferences for your keyboard in your OS. Next, set up the input source as Korean, Japanese, or Chinese and then start to edit any of the cell editors within Handsontable.

## Watch IME in action

<video controls loop v-bind:src="'/docs/'+ $page.currentVersion + '/img/pages/ime-support/ime-support-in-handsontable.mp4'" width="100%"></video>

## Related API reference

- Configuration options:
  - [`language`](@/api/options.md#language)
  - [`layoutDirection`](@/api/options.md#layoutdirection)
  - [`locale`](@/api/options.md#locale)
  - [`imeFastEdit`](@/api/options.md#imefastedit)
- Core methods:
  - [`getDirectionFactor()`](@/api/core.md#getdirectionfactor)
  - [`getTranslatedPhrase()`](@/api/core.md#gettranslatedphrase)
  - [`isLtr()`](@/api/core.md#isltr)
  - [`isRtl()`](@/api/core.md#isrtl)
- Hooks:
  - [`afterLanguageChange`](@/api/hooks.md#afterlanguagechange)
  - [`beforeLanguageChange`](@/api/hooks.md#beforelanguagechange)
