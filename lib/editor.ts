import type {
  BackgroundConfig,
  EditorBlock,
  EditorState,
  ImageBlockProps,
  ShapeBlockProps,
  TextBlockProps,
} from "@/types/editor";
import { sanitizeHtml } from "./validation/sanitizeHtml";

export function renderBackground(background: BackgroundConfig): string {
  switch (background.type) {
    case "color":
      return background.value;
    case "gradient":
      return background.value;
    case "image":
      return `url(${background.value}) center / cover no-repeat`;
  }
}

function textCss(props: TextBlockProps): string {
  return (
    `display:flex;align-items:center;justify-content:${props.align};` +
    `font-size:${props.fontSize}px;font-weight:${props.fontWeight};` +
    `font-family:${props.fontFamily};color:${props.color};` +
    `line-height:${props.lineHeight};text-align:${props.align};`
  );
}

function renderBlock(block: EditorBlock): string {
  const pos =
    `position:absolute;left:${block.x}%;top:${block.y}%;` +
    `width:${block.width}%;height:${block.height}%;z-index:${block.zIndex};`;

  switch (block.type) {
    case "text": {
      const props = block.props as TextBlockProps;
      return `<div style="${pos}${textCss(props)}">${sanitizeHtml(props.content)}</div>`;
    }
    case "image": {
      const props = block.props as ImageBlockProps;
      return `<img style="${pos}object-fit:${props.objectFit};" src="${props.src}" alt="" />`;
    }
    case "shape": {
      const props = block.props as ShapeBlockProps;
      const radius = props.shape === "circle" ? "50%" : `${props.radius ?? 0}px`;
      const stroke = props.stroke ? `border:2px solid ${props.stroke};` : "";
      return `<div style="${pos}background:${props.fill};border-radius:${radius};${stroke}"></div>`;
    }
    case "logo":
      return `<img style="${pos}" src="{{LOGO_URL}}" alt="logo" />`;
  }
}

// Pure: sorts a copy of state.blocks (never mutates the input), no
// randomness/timestamps/side effects — same EditorState in, same HTML out.
export function renderEditorHtml(state: EditorState): string {
  const aspectRatioPercent = (state.height / state.width) * 100;
  const blocks = [...state.blocks].sort((a, b) => a.zIndex - b.zIndex);
  const visibleBlocksHtml = blocks
    .filter((block) => block.visible)
    .map(renderBlock)
    .join("\n");

  return (
    `<div class="slide-canvas" style="` +
    `position:relative;width:100%;padding-top:${aspectRatioPercent}%;` +
    `background:${renderBackground(state.background)};overflow:hidden;` +
    `font-family:var(--font-family);">${visibleBlocksHtml}</div>`
  );
}
