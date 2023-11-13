import { useAddClass, RendererProps } from "./utils";

export function StarsRenderer(props: RendererProps) {
  useAddClass(props);

  return <div className="star htCenter" aria-label={props.value}>{"★".repeat(props.value)}</div>;
}
