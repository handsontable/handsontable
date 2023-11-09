import { useAddClass, RendererProps } from "./utils";

export function ProgressBarRenderer(props: RendererProps) {
  useAddClass(props);

  return (
    <div aria-label={`${props.value * 10}%`} className={`progressBar`} style={{ width: `${props.value * 10}px` }} />
  );
}
