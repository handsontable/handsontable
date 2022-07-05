---
title: SamplesGenerator
metaTitle: SamplesGenerator - API Reference - Handsontable Documentation
permalink: /12.1/api/samples-generator
canonicalUrl: /api/samples-generator
hotPlugin: false
editLink: false
---

# SamplesGenerator

[[toc]]
## Members

### allowDuplicates
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/utils/samplesGenerator.js#L45

:::

_samplesGenerator.allowDuplicates : boolean_

`true` if duplicate samples collection should be allowed, `false` otherwise.

**Default**: <code>{false}</code>  


### customSampleCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/utils/samplesGenerator.js#L38

:::

_samplesGenerator.customSampleCount : number_

Custom number of samples to take of each value length.

**Default**: <code>{null}</code>  


### dataFactory
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/utils/samplesGenerator.js#L31

:::

_samplesGenerator.dataFactory : function_

Function which give the data to collect samples.



### SAMPLE_COUNT
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/utils/samplesGenerator.js#L14

:::

_SamplesGenerator.SAMPLE\_COUNT : number_

Number of samples to take of each value length.



### samples
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/utils/samplesGenerator.js#L25

:::

_samplesGenerator.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  

## Methods

### generateColumnSamples
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/utils/samplesGenerator.js#L97

:::

_samplesGenerator.generateColumnSamples(colRange, rowRange) ⇒ object_

Generate samples for column. You can control which area should be sampled by passing `colRange` object and `rowRange` object.


| Param | Type | Description |
| --- | --- | --- |
| colRange | `object` | Column index. |
| rowRange | `object` | Column index. |



### generateRowSamples
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/utils/samplesGenerator.js#L86

:::

_samplesGenerator.generateRowSamples(rowRange, colRange) ⇒ object_

Generate samples for row. You can control which area should be sampled by passing `rowRange` object and `colRange` object.


| Param | Type | Description |
| --- | --- | --- |
| rowRange | `object` <br/> `number` | The rows range to generate the samples. |
| colRange | `object` | The column range to generate the samples. |



### generateSample
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/utils/samplesGenerator.js#L131

:::

_samplesGenerator.generateSample(type, range, specifierValue) ⇒ Map_

Generate sample for specified type (`row` or `col`).


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Samples type `row` or `col`. |
| range | `object` | The range to generate the samples. |
| specifierValue | `number` | The range to generate the samples. |



### generateSamples
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/utils/samplesGenerator.js#L109

:::

_samplesGenerator.generateSamples(type, range, specifierRange) ⇒ Map_

Generate collection of samples.


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Type to generate. Can be `col` or `row`. |
| range | `object` | The range to generate the samples. |
| specifierRange | `object` <br/> `number` | The range to generate the samples. |



### getSampleCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/utils/samplesGenerator.js#L53

:::

_samplesGenerator.getSampleCount() ⇒ number_

Get the sample count for this instance.



### setAllowDuplicates
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/utils/samplesGenerator.js#L75

:::

_samplesGenerator.setAllowDuplicates(allowDuplicates)_

Set if the generator should accept duplicate values.


| Param | Type | Description |
| --- | --- | --- |
| allowDuplicates | `boolean` | `true` to allow duplicate values. |



### setSampleCount
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/utils/samplesGenerator.js#L66

:::

_samplesGenerator.setSampleCount(sampleCount)_

Set the sample count.


| Param | Type | Description |
| --- | --- | --- |
| sampleCount | `number` | Number of samples to be collected. |


