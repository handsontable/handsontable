import React, { useEffect } from "react";

export const Test = () => {
  useEffect(() => {
    console.log("hello world");
  }, []);
  return <div></div>;
};
