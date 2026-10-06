"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DraggableCore, type DraggableData, type DraggableEvent } from "react-draggable";
import type { EditorBlock, EditorState, ImageBlockProps, ShapeBlockProps, TextBlockProps } from "@/types/editor";
import { renderBackground } from "@/lib/editor";
import type { useEditorState } from "@/hooks/useEditorState";
import { useBranding } from "@/components/editor/BrandingContext";
import { TextBlock } from "@/components/editor/blocks/TextBlock";
import { ImageBlock } from "@/components/editor/blocks/ImageBlock";
import { ShapeBlock } from "@/components/editor/blocks/ShapeBlock";
import { LogoBlock } from "@/components/editor/blocks/LogoBlock";

type EditorApi = ReturnType<typeof useEditorState>;

const MIN_SIZE_PERCENT = 2;
const HANDLES = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
type HandleDirection = (typeof HANDLES)[number];

type TextEditHandlers = {
  onTextFocus: () => void;
  onTextInput: (blockId: string, content: string) => void;
  onTextBlur: () => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function BlockContent({ block, selected, textEdit }: { block: EditorBlock; selected: boolean; textEdit: TextEditHandlers }) {
  switch (block.type) {
    case "text":
      return (
        <TextBlock
          props={block.props as TextBlockProps}
          editable={selected && !block.locked}
          onFocus={textEdit.onTextFocus}
          onInput={(content) => textEdit.onTextInput(block.id, content)}
          onBlur={textEdit.onTextBlur}
        />
      );
    case "image":
      return <ImageBlock props={block.props as ImageBlockProps} />;
    case "shape":
      return <ShapeBlock props={block.props as ShapeBlockProps} />;
    case "logo":
      return <LogoBlock />;
  }
}

function EditorBlockView({
  block,
  selected,
  scale,
  textEdit,
  onSelect,
  onDragStart,
  onDrag,
  onDragStop,
  onResizeStart,
}: {
  block: EditorBlock;
  selected: boolean;
  scale: number;
  textEdit: TextEditHandlers;
  onSelect: () => void;
  onDragStart: () => void;
  onDrag: (event: DraggableEvent, data: DraggableData) => void;
  onDragStop: () => void;
  onResizeStart: (direction: HandleDirection, event: React.PointerEvent) => void;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const inverseScale = scale > 0 ? 1 / scale : 1;

  return (
    <DraggableCore nodeRef={nodeRef} disabled={block.locked} onStart={onDragStart} onDrag={onDrag} onStop={onDragStop}>
      <div
        ref={nodeRef}
        className={`editor-block${selected ? " selected" : ""}`}
        style={{
          position: "absolute",
          left: `${block.x}%`,
          top: `${block.y}%`,
          width: `${block.width}%`,
          height: `${block.height}%`,
          zIndex: block.zIndex,
          cursor: block.locked ? "default" : "move",
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <BlockContent block={block} selected={selected} textEdit={textEdit} />
        {selected && !block.locked && (
          <div className="resize-handles" style={{ transform: `scale(${inverseScale})` }}>
            {HANDLES.map((direction) => (
              <div
                key={direction}
                className={`resize-handle handle-${direction}`}
                onPointerDown={(event) => onResizeStart(direction, event)}
              />
            ))}
          </div>
        )}
      </div>
    </DraggableCore>
  );
}

export function EditorCanvas({ editor }: { editor: EditorApi }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragSnapshotRef = useRef<EditorState | null>(null);
  const resizeSnapshotRef = useRef<EditorState | null>(null);
  const textEditSnapshotRef = useRef<EditorState | null>(null);
  const [displayWidth, setDisplayWidth] = useState<number | null>(null);
  const branding = useBranding();

  const { state, selectedBlockId, selectBlock, updateBlockLive, commitBlock, undo, redo } = editor;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setDisplayWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isEditableTarget) return;
      const key = event.key.toLowerCase();
      if (key !== "z" || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  const aspectRatioPercent = (state.height / state.width) * 100;
  const scale = displayWidth ? displayWidth / state.width : 1;

  const handleDragStart = useCallback(() => {
    dragSnapshotRef.current = state;
  }, [state]);

  const handleDrag = useCallback(
    (blockId: string, _event: DraggableEvent, data: DraggableData) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      const block = state.blocks.find((b) => b.id === blockId);
      if (!rect || !block) return;
      const deltaXPercent = (data.deltaX / rect.width) * 100;
      const deltaYPercent = (data.deltaY / rect.height) * 100;
      const x = clamp(block.x + deltaXPercent, 0, 100 - block.width);
      const y = clamp(block.y + deltaYPercent, 0, 100 - block.height);
      updateBlockLive(blockId, { x, y });
    },
    [state, updateBlockLive],
  );

  const handleDragStop = useCallback(() => {
    if (dragSnapshotRef.current) {
      commitBlock(dragSnapshotRef.current);
      dragSnapshotRef.current = null;
    }
  }, [commitBlock]);

  const handleResizeStart = useCallback(
    (blockId: string, direction: HandleDirection, event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const rect = wrapperRef.current?.getBoundingClientRect();
      const block = state.blocks.find((b) => b.id === blockId);
      if (!rect || !block) return;
      resizeSnapshotRef.current = state;
      const start = { x: event.clientX, y: event.clientY };
      const startBlock = { x: block.x, y: block.y, width: block.width, height: block.height };

      function onPointerMove(moveEvent: PointerEvent) {
        const deltaXPercent = ((moveEvent.clientX - start.x) / rect!.width) * 100;
        const deltaYPercent = ((moveEvent.clientY - start.y) / rect!.height) * 100;
        let { x, y, width, height } = startBlock;

        if (direction.includes("e")) {
          width = clamp(startBlock.width + deltaXPercent, MIN_SIZE_PERCENT, 100 - startBlock.x);
        }
        if (direction.includes("s")) {
          height = clamp(startBlock.height + deltaYPercent, MIN_SIZE_PERCENT, 100 - startBlock.y);
        }
        if (direction.includes("w")) {
          const clampedDeltaX = clamp(deltaXPercent, -startBlock.x, startBlock.width - MIN_SIZE_PERCENT);
          x = startBlock.x + clampedDeltaX;
          width = startBlock.width - clampedDeltaX;
        }
        if (direction.includes("n")) {
          const clampedDeltaY = clamp(deltaYPercent, -startBlock.y, startBlock.height - MIN_SIZE_PERCENT);
          y = startBlock.y + clampedDeltaY;
          height = startBlock.height - clampedDeltaY;
        }

        updateBlockLive(blockId, { x, y, width, height });
      }

      function onPointerUp() {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        if (resizeSnapshotRef.current) {
          commitBlock(resizeSnapshotRef.current);
          resizeSnapshotRef.current = null;
        }
      }

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [state, updateBlockLive, commitBlock],
  );

  const handleTextFocus = useCallback(() => {
    textEditSnapshotRef.current = state;
  }, [state]);

  const handleTextInput = useCallback(
    (blockId: string, content: string) => {
      const block = state.blocks.find((b) => b.id === blockId);
      if (!block) return;
      const props = block.props as TextBlockProps;
      updateBlockLive(blockId, { props: { ...props, content } });
    },
    [state, updateBlockLive],
  );

  const handleTextBlur = useCallback(() => {
    if (textEditSnapshotRef.current) {
      commitBlock(textEditSnapshotRef.current);
      textEditSnapshotRef.current = null;
    }
  }, [commitBlock]);

  const textEdit: TextEditHandlers = { onTextFocus: handleTextFocus, onTextInput: handleTextInput, onTextBlur: handleTextBlur };

  const sortedBlocks = [...state.blocks].sort((a, b) => a.zIndex - b.zIndex);

  const brandingStyle = {
    "--color-primary": branding.primaryColor,
    "--color-secondary": branding.secondaryColor,
    "--color-accent": branding.accentColor,
    "--font-family": branding.fontFamily,
  } as React.CSSProperties;

  return (
    <div
      ref={wrapperRef}
      className="editor-canvas"
      style={{
        ...brandingStyle,
        paddingTop: `${aspectRatioPercent}%`,
        background: renderBackground(state.background),
      }}
      onClick={() => selectBlock(null)}
    >
      <div
        className="editor-canvas-stage"
        style={{
          width: state.width,
          height: state.height,
          transform: `scale(${scale})`,
        }}
      >
        {sortedBlocks
          .filter((block) => block.visible)
          .map((block) => (
            <EditorBlockView
              key={block.id}
              block={block}
              selected={block.id === selectedBlockId}
              scale={scale}
              textEdit={textEdit}
              onSelect={() => selectBlock(block.id)}
              onDragStart={handleDragStart}
              onDrag={(event, data) => handleDrag(block.id, event, data)}
              onDragStop={handleDragStop}
              onResizeStart={(direction, event) => handleResizeStart(block.id, direction, event)}
            />
          ))}
      </div>
    </div>
  );
}
