import React from "react";
import { addClassWhenNeeded, RendererProps } from "./utils";

export function ProgressBarRenderer(props: RendererProps) {
  addClassWhenNeeded(props);

  return (
    <div className={`progressBar`} style={{ width: `${props.value * 10}px` }} />
  );
}
