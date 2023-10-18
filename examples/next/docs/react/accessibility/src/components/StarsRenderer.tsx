import { useAddClass, RendererProps } from "./utils";

export function StarsRenderer(props: RendererProps) {
  useAddClass(props);

  return <div className="star htCenter">{"★".repeat(props.value)}</div>;
}
