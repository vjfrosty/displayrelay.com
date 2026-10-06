"use client";

import type { TextBlockProps } from "@/types/editor";

export function TextBlock({
  props,
  editable,
  onFocus,
  onInput,
  onBlur,
}: {
  props: TextBlockProps;
  editable: boolean;
  onFocus: () => void;
  onInput: (content: string) => void;
  onBlur: () => void;
}) {
  return (
    <div
      className="editor-block-text"
      contentEditable={editable}
      suppressContentEditableWarning
      onFocus={editable ? onFocus : undefined}
      onBlur={editable ? onBlur : undefined}
      onInput={editable ? (event) => onInput(event.currentTarget.textContent ?? "") : undefined}
      onPointerDown={(event) => {
        // While already selected/editable, let clicks place a text cursor
        // instead of bubbling to DraggableCore and starting a move gesture.
        if (editable) event.stopPropagation();
      }}
      style={{
        justifyContent: props.align,
        fontSize: props.fontSize,
        fontWeight: props.fontWeight,
        fontFamily: props.fontFamily,
        color: props.color,
        lineHeight: props.lineHeight,
        textAlign: props.align,
      }}
    >
      {props.content}
    </div>
  );
}
