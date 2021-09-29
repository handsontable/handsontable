---
title: CommandExecutor
metaTitle: CommandExecutor - Plugin - Handsontable Documentation
permalink: /10.0/api/command-executor
canonicalUrl: /api/command-executor
hotPlugin: true
editLink: false
---

# CommandExecutor

[[toc]]

## Description

Command executor for ContextMenu.


## Methods

### execute
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/commandExecutor.js#L43

:::

_commandExecutor.execute(commandName, ...params)_

Execute command by its name.


| Param | Type | Description |
| --- | --- | --- |
| commandName | `string` | Command id. |
| ...params | `*` | Arguments passed to command task. |



### registerCommand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/commandExecutor.js#L24

:::

_commandExecutor.registerCommand(name, commandDescriptor)_

Register command.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Command name. |
| commandDescriptor | `object` | Command descriptor object with properties like `key` (command id),                                   `callback` (task to execute), `name` (command name), `disabled` (command availability). |



### setCommonCallback
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/commandExecutor.js#L33

:::

_commandExecutor.setCommonCallback(callback)_

Set common callback which will be trigger on every executed command.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Function which will be fired on every command execute. |


