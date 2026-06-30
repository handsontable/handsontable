---
title: CommandExecutor
metaTitle: CommandExecutor API reference – JavaScript Data Grid | Handsontable
permalink: /api/command-executor
canonicalUrl: /api/command-executor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Initializes the command executor with a reference to the Handsontable instance.


## Members

### commands

::: ask-about-api commands|CommandExecutor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/commandExecutor.ts#L71

:::

_commandExecutor.commands : object_



### commonCallback

::: ask-about-api commonCallback|CommandExecutor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/commandExecutor.ts#L74

:::

_commandExecutor.commonCallback : function_


## Methods

### execute

::: ask-about-api execute|CommandExecutor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/commandExecutor.ts#L36

:::

_commandExecutor.execute(commandName, ...params)_

Execute command by its name.


| Param | Type | Description |
| --- | --- | --- |
| commandName | `string` | Command id. |
| ...params | `*` | Arguments passed to command task. |



### registerCommand

::: ask-about-api registerCommand|CommandExecutor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/commandExecutor.ts#L21

:::

_commandExecutor.registerCommand(name, commandDescriptor)_

Register command.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Command name. |
| commandDescriptor | `object` | Command descriptor object with properties like `key` (command id),                                   `callback` (task to execute), `name` (command name), `disabled` (command availability). |



### setCommonCallback

::: ask-about-api setCommonCallback|CommandExecutor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/commandExecutor.ts#L28

:::

_commandExecutor.setCommonCallback(callback)_

Set common callback which will be trigger on every executed command.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Function which will be fired on every command execute. |


