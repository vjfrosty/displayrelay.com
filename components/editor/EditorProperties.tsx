"use client";

import type { useEditorState } from "@/hooks/useEditorState";
import type { ImageBlockProps, LogoBlockProps, ShapeBlockProps, TextBlockProps } from "@/types/editor";
import { ImageSearchPanel } from "./panels/ImageSearchPanel";

type EditorApi = ReturnType<typeof useEditorState>;

export function EditorProperties({ clientId, editor }: { clientId: string; editor: EditorApi }) {
  const { state, selectedBlockId, updateBlock } = editor;
  const block = state.blocks.find((b) => b.id === selectedBlockId);

  if (!block) {
    return (
      <div className="editor-properties">
        <p className="lead">Select a block to edit its properties.</p>
      </div>
    );
  }

  return (
    <div className="editor-properties">
      <h3>{block.type} block</h3>
      {block.type === "text" && (
        <TextProperties
          props={block.props as TextBlockProps}
          onChange={(patch) => updateBlock(block.id, { props: { ...(block.props as TextBlockProps), ...patch } })}
        />
      )}
      {block.type === "shape" && (
        <ShapeProperties
          props={block.props as ShapeBlockProps}
          onChange={(patch) => updateBlock(block.id, { props: { ...(block.props as ShapeBlockProps), ...patch } })}
        />
      )}
      {block.type === "image" && (
        <>
          <ImageProperties
            props={block.props as ImageBlockProps}
            onChange={(patch) => updateBlock(block.id, { props: { ...(block.props as ImageBlockProps), ...patch } })}
          />
          <ImageSearchPanel clientId={clientId} blockId={block.id} editor={editor} />
        </>
      )}
      {block.type === "logo" && (
        <LogoProperties
          props={block.props as LogoBlockProps}
          onChange={(patch) => updateBlock(block.id, { props: { ...(block.props as LogoBlockProps), ...patch } })}
        />
      )}
    </div>
  );
}

function TextProperties({
  props,
  onChange,
}: {
  props: TextBlockProps;
  onChange: (patch: Partial<TextBlockProps>) => void;
}) {
  return (
    <div className="properties-fields">
      <label>
        Font size
        <input type="number" value={props.fontSize} onChange={(event) => onChange({ fontSize: Number(event.target.value) })} />
      </label>
      <label>
        Color
        <input type="color" value={props.color} onChange={(event) => onChange({ color: event.target.value })} />
      </label>
      <label>
        Align
        <select value={props.align} onChange={(event) => onChange({ align: event.target.value as TextBlockProps["align"] })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>
      <label>
        Weight
        <select value={props.fontWeight} onChange={(event) => onChange({ fontWeight: event.target.value })}>
          <option value="400">Normal</option>
          <option value="600">Semibold</option>
          <option value="700">Bold</option>
        </select>
      </label>
    </div>
  );
}

function ShapeProperties({
  props,
  onChange,
}: {
  props: ShapeBlockProps;
  onChange: (patch: Partial<ShapeBlockProps>) => void;
}) {
  return (
    <div className="properties-fields">
      <label>
        Shape
        <select value={props.shape} onChange={(event) => onChange({ shape: event.target.value as ShapeBlockProps["shape"] })}>
          <option value="rectangle">Rectangle</option>
          <option value="circle">Circle</option>
          <option value="line">Line</option>
        </select>
      </label>
      <label>
        Fill
        <input type="color" value={props.fill} onChange={(event) => onChange({ fill: event.target.value })} />
      </label>
      <label>
        Stroke
        <input type="color" value={props.stroke ?? "#000000"} onChange={(event) => onChange({ stroke: event.target.value })} />
      </label>
      <label>
        Radius
        <input type="number" value={props.radius ?? 0} onChange={(event) => onChange({ radius: Number(event.target.value) })} />
      </label>
    </div>
  );
}

function ImageProperties({
  props,
  onChange,
}: {
  props: ImageBlockProps;
  onChange: (patch: Partial<ImageBlockProps>) => void;
}) {
  return (
    <div className="properties-fields">
      <label>
        Fit
        <select
          value={props.objectFit}
          onChange={(event) => onChange({ objectFit: event.target.value as ImageBlockProps["objectFit"] })}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
        </select>
      </label>
    </div>
  );
}

function LogoProperties({
  props,
  onChange,
}: {
  props: LogoBlockProps;
  onChange: (patch: Partial<LogoBlockProps>) => void;
}) {
  return (
    <div className="properties-fields">
      <label>
        Scale
        <input
          type="number"
          step="0.1"
          value={props.scale ?? 1}
          onChange={(event) => onChange({ scale: Number(event.target.value) })}
        />
      </label>
    </div>
  );
}
