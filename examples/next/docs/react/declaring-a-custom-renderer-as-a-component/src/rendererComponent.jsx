import React from "react";

export function RendererComponent(props) {
  // The avaiable renderer-related props are:
  // - row (row index)
  // - col (column index)
  // - prop (column property name)
  // - TD (the HTML cell element)
  // - cellProperties (the cellProperties object for the edited cell)
  return (
    <>
      <i style={{ color: "#a9a9a9" }}>
        Row: {props.row}, column: {props.col},
      </i>{" "}
      value: {props.value}
    </>
  );
}
