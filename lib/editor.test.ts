import { describe, expect, it } from "vitest";
import { renderEditorHtml } from "./editor";
import type { EditorBlock, EditorState } from "@/types/editor";

const BASE_STATE: EditorState = {
  version: 1,
  width: 1920,
  height: 1080,
  orientation: "landscape",
  background: { type: "color", value: "#0f172a" },
  blocks: [],
  meta: { duration: 10, transition: "fade" },
};

function textBlock(overrides: Partial<EditorBlock> = {}): EditorBlock {
  return {
    id: "text-1",
    type: "text",
    x: 5,
    y: 10,
    width: 90,
    height: 20,
    zIndex: 1,
    locked: false,
    visible: true,
    props: {
      content: "Hello world",
      fontSize: 40,
      fontWeight: "600",
      fontFamily: "sans-serif",
      color: "#ffffff",
      align: "center",
      lineHeight: 1.2,
    },
    ...overrides,
  };
}

describe("renderEditorHtml", () => {
  it("returns valid HTML for a simple color-background slide", () => {
    const html = renderEditorHtml(BASE_STATE);
    expect(html).toContain('class="slide-canvas"');
    expect(html).toContain("background:#0f172a");
  });

  it("computes the aspect ratio from width/height instead of hardcoding 16:9", () => {
    const portrait = renderEditorHtml({ ...BASE_STATE, width: 1080, height: 1920 });
    expect(portrait).toContain("padding-top:177.77777777777777%");

    const landscape = renderEditorHtml(BASE_STATE);
    expect(landscape).toContain("padding-top:56.25%");
  });

  it("sanitizes script tags out of text block content", () => {
    const html = renderEditorHtml({
      ...BASE_STATE,
      blocks: [textBlock({ props: { ...textBlock().props, content: '<script>alert(1)</script>Hi' } as never })],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("Hi");
  });

  it("renders an image block as an img tag with src and object-fit", () => {
    const html = renderEditorHtml({
      ...BASE_STATE,
      blocks: [
        {
          id: "img-1",
          type: "image",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 1,
          locked: false,
          visible: true,
          props: { src: "http://localhost/assets/pic.png", objectFit: "cover" },
        },
      ],
    });
    expect(html).toContain('<img style="position:absolute;left:0%;top:0%;width:100%;height:100%;z-index:1;object-fit:cover;" src="http://localhost/assets/pic.png" alt="" />');
  });

  it("renders logo blocks as {{LOGO_URL}}, never a literal asset URL", () => {
    const html = renderEditorHtml({
      ...BASE_STATE,
      blocks: [
        {
          id: "logo-1",
          type: "logo",
          x: 80,
          y: 80,
          width: 15,
          height: 15,
          zIndex: 5,
          locked: true,
          visible: true,
          props: { scale: 1 },
        },
      ],
    });
    expect(html).toContain('src="{{LOGO_URL}}"');
  });

  it("renders blocks in zIndex order regardless of input array order", () => {
    const html = renderEditorHtml({
      ...BASE_STATE,
      blocks: [
        textBlock({ id: "back", zIndex: 1, props: { ...textBlock().props, content: "back" } as never }),
        textBlock({ id: "front", zIndex: 5, props: { ...textBlock().props, content: "front" } as never }),
      ].reverse(),
    });
    expect(html.indexOf("back")).toBeLessThan(html.indexOf("front"));
  });

  it("excludes invisible blocks", () => {
    const html = renderEditorHtml({
      ...BASE_STATE,
      blocks: [textBlock({ visible: false, props: { ...textBlock().props, content: "hidden-text" } as never })],
    });
    expect(html).not.toContain("hidden-text");
  });

  it("is pure: identical input produces byte-identical output", () => {
    const state = { ...BASE_STATE, blocks: [textBlock()] };
    expect(renderEditorHtml(state)).toBe(renderEditorHtml(state));
  });

  it("does not mutate the input blocks array", () => {
    const blocks = [textBlock({ id: "a", zIndex: 5 }), textBlock({ id: "b", zIndex: 1 })];
    const state = { ...BASE_STATE, blocks };
    renderEditorHtml(state);
    expect(blocks[0].id).toBe("a");
    expect(blocks[1].id).toBe("b");
  });
});
