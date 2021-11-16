import React, { useContext } from "react";
import { HighlightContext } from "./highlightContext";

export function CustomRenderer(props) {
  const darkMode = useContext(HighlightContext);

  if (darkMode) {
    props.TD.className = "dark";
  } else {
    props.TD.className = "";
  }

  return <div>{props.value}</div>;
}
