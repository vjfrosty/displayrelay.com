// EditorState/EditorBlock definitions per architecture doc Section 9.3, with
// the block type union scoped to text/image/shape/logo — Section 9.3 also
// lists "qr"/"video" but neither has a specified props shape anywhere in the
// source docs, and neither is in the P1 feature list. Add them (with a real
// props type) when a task actually needs them.

export type EditorState = {
  version: number;
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
  background: BackgroundConfig;
  blocks: EditorBlock[];
  meta: {
    duration: number;
    transition: "none" | "fade" | "slide";
  };
};

export type EditorBlockType = "text" | "image" | "shape" | "logo";

export type EditorBlock = {
  id: string;
  type: EditorBlockType;
  x: number; // left offset %
  y: number; // top offset %
  width: number; // % of canvas width
  height: number; // % of canvas height
  zIndex: number;
  locked: boolean;
  visible: boolean;
  props: TextBlockProps | ImageBlockProps | ShapeBlockProps | LogoBlockProps;
};

export type TextBlockProps = {
  content: string; // plain text or simple HTML
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  color: string;
  align: "left" | "center" | "right";
  lineHeight: number;
};

export type ImageBlockProps = {
  src: string; // MinIO URL or Pexels URL
  objectFit: "cover" | "contain" | "fill";
  attribution?: string;
  pexelsId?: string;
  provider?: "pexels" | "pixabay" | "openverse" | "upload";
};

// Field list per architecture doc Section 14.2's block-type table — Section
// 9.3 references ShapeBlockProps in the props union without defining it.
export type ShapeBlockProps = {
  shape: "rectangle" | "circle" | "line";
  fill: string;
  stroke?: string;
  radius?: number;
};

// Field list per Section 14.2. The renderer never reads these (logo blocks
// always render {{LOGO_URL}} for display-time substitution).
export type LogoBlockProps = {
  scale?: number;
  position?: string;
};

export type BackgroundConfig = {
  type: "color" | "gradient" | "image";
  value: string; // hex | "linear-gradient(...)" | MinIO URL
};
