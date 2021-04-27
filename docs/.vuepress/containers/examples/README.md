# Examples Container

For purpose of presenting demo snippets runs live.

## Dependency flow

<details>
<summary>PlantUML code</summary>

[Edit](https://www.planttext.com/?text=RP0n3eCm34NtdC9YwfBs1XL3Ru4OJ69eQ31H4YIaYhitK840CJxh-xyuUOZeuz1P8Hog3pO4cUevec7ouK4ZTivIoE0h00hLQvBLOAmcVsz3ES_QK1kjBQsyhYmy2SEHV8qgzMvbOYTx8-im2ojBiaDEG_-t0Uns6uelSiIQM9cvOaebcwi4EJXvSXze2JmlBhXC7Muwq9AuGN5wJob4dY3zumy0)

```plantuml
@startuml

package "containers/examples" {
  [code-builder.js]
  [jsfiddle.js]
  [examples.js]
}
interface "examples"


package "handsontable-manager" {
    interface "getDependencies"
}


[examples] -up- [examples.js]
[examples.js] -up-> [code-builder.js]
[examples.js] -up-> [jsfiddle.js]
[jsfiddle.js] -up-( [getDependencies]

@enduml
```
</details>

![Dependency flow](./dependency-flow.png)
