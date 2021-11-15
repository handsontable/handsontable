import React from "react";

// The avaiable renderer-related props are:
// - row (row index)
// - col (column index)
// - prop (column property name)
// - TD (the HTML cell element)
// - cellProperties (the cellProperties object for the edited cell)

export const ScoreRenderer = (props) => {
  const { value } = props;
  const color = value > 60 ? "#2ECC40" : "#FF4136";
  return (
    <>
      <span style={{ color }}>{value}</span>
    </>
  );
};

export const PromotionRenderer = (props) => {
  const { value } = props;
  if (value) {
    return (
      <>
        <span>&#10004;</span>
      </>
    );
  }
  return (
    <>
      <span>&#10007;</span>
    </>
  );
};
