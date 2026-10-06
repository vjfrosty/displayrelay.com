import type { ImageBlockProps } from "@/types/editor";

export function ImageBlock({ props }: { props: ImageBlockProps }) {
  if (!props.src) {
    return <div className="editor-block-image-placeholder">No image selected — use the properties panel to search</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element -- canvas preview, not a Next-optimized asset
  return <img className="editor-block-image" src={props.src} alt="" style={{ objectFit: props.objectFit }} draggable={false} />;
}
