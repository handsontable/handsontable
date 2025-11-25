---
title: SamplesGenerator
metaTitle: SamplesGenerator - JavaScript Data Grid | Handsontable
permalink: /api/samples-generator
canonicalUrl: /api/samples-generator
searchCategory: API Reference
hotPlugin: false
editLink: false
id: n9lf8vn4
description: Options, members, and methods of Handsontable's SamplesGenerator API.
react:
  id: gh3nicnu
  metaTitle: SamplesGenerator - React Data Grid | Handsontable
angular:
  id: z8s1b9qr
  metaTitle: SamplesGenerator - Angular Data Grid | Handsontable
---

# Plugin: SamplesGenerator

[[toc]]
## Members

### allowDuplicates
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L43

:::

_samplesGenerator.allowDuplicates : boolean_

`true` if duplicate samples collection should be allowed, `false` otherwise.

**Default**: <code>{false}</code>  


### customSampleCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L36

:::

_samplesGenerator.customSampleCount : number_

Custom number of samples to take of each value length.

**Default**: <code>{null}</code>  


### dataFactory
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L29

:::

_samplesGenerator.dataFactory : function_

Function which give the data to collect samples.



### includeHidden
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L50

:::

_samplesGenerator.includeHidden : boolean_

`true` if hidden samples should be included, `false` otherwise.

**Default**: <code>{false}</code>  


### SAMPLE_COUNT
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L14

:::

_SamplesGenerator.SAMPLE\_COUNT : number_

Number of samples to take of each value length.



### samples
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L23

:::

_samplesGenerator.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  

## Methods

### generateColumnSamples
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L114

:::

_samplesGenerator.generateColumnSamples(colRange, rowRange) ⇒ object_

Generate samples for column. You can control which area should be sampled by passing `colRange` object and `rowRange` object.


| Param | Type | Description |
| --- | --- | --- |
| colRange | `object` | Column index. |
| rowRange | `object` | Column index. |



### generateRowSamples
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L103

:::

_samplesGenerator.generateRowSamples(rowRange, colRange) ⇒ object_

Generate samples for row. You can control which area should be sampled by passing `rowRange` object and `colRange` object.


| Param | Type | Description |
| --- | --- | --- |
| rowRange | `object` <br/> `number` | The rows range to generate the samples. |
| colRange | `object` | The column range to generate the samples. |



### generateSample
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L148

:::

_samplesGenerator.generateSample(type, range, specifierValue) ⇒ Map_

Generate sample for specified type (`row` or `col`).


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Samples type `row` or `col`. |
| range | `object` | The range to generate the samples. |
| specifierValue | `number` | The range to generate the samples. |



### generateSamples
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L126

:::

_samplesGenerator.generateSamples(type, range, specifierRange) ⇒ Map_

Generate collection of samples.


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Type to generate. Can be `col` or `row`. |
| range | `object` | The range to generate the samples. |
| specifierRange | `object` <br/> `number` | The range to generate the samples. |



### getSampleCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L61

:::

_samplesGenerator.getSampleCount() ⇒ number_

Get the sample count for this instance.



### setAllowDuplicates
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L83

:::

_samplesGenerator.setAllowDuplicates(allowDuplicates)_

Set if the generator should accept duplicate values.


| Param | Type | Description |
| --- | --- | --- |
| allowDuplicates | `boolean` | `true` to allow duplicate values. |



### setIncludeHidden
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L92

:::

_samplesGenerator.setIncludeHidden(includeHidden)_

Sets the sampler to the mode where it will generate samples for hidden indexes.


| Param | Type | Description |
| --- | --- | --- |
| includeHidden | `boolean` | `true` to include hidden indexes, `false` otherwise. |



### setSampleCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/utils/samplesGenerator.js#L74

:::

_samplesGenerator.setSampleCount(sampleCount)_

Set the sample count.


| Param | Type | Description |
| --- | --- | --- |
| sampleCount | `number` | Number of samples to be collected. |


