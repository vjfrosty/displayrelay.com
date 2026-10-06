import type { ShapeBlockProps } from "@/types/editor";

export function ShapeBlock({ props }: { props: ShapeBlockProps }) {
  const radius = props.shape === "circle" ? "50%" : `${props.radius ?? 0}px`;
  return (
    <div
      className="editor-block-shape"
      style={{
        background: props.fill,
        borderRadius: radius,
        border: props.stroke ? `2px solid ${props.stroke}` : undefined,
      }}
    />
  );
}
