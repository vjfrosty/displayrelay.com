"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { produce } from "immer";
import type { EditorBlock, EditorState } from "@/types/editor";

const MAX_HISTORY = 50;

export type History = {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
};

type Action =
  | { type: "ADD_BLOCK"; block: EditorBlock }
  | { type: "REMOVE_BLOCK"; id: string }
  | { type: "UPDATE_BLOCK"; id: string; patch: Partial<EditorBlock> }
  | { type: "UPDATE_BLOCK_LIVE"; id: string; patch: Partial<EditorBlock> }
  | { type: "COMMIT"; before: EditorState }
  | { type: "UNDO" }
  | { type: "REDO" };

function pushPast(past: EditorState[], entry: EditorState): EditorState[] {
  const next = [...past, entry];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

function applyBlockPatch(state: EditorState, id: string, patch: Partial<EditorBlock>): EditorState {
  return produce(state, (draft) => {
    const block = draft.blocks.find((b) => b.id === id);
    if (block) Object.assign(block, patch);
  });
}

// Exported (alongside the hook) so the undo/redo/live-update logic can be
// unit tested directly without mounting a component or adding DOM-rendering
// test infrastructure this project doesn't otherwise use.
export function reducer(history: History, action: Action): History {
  switch (action.type) {
    case "ADD_BLOCK": {
      const before = history.present;
      const present = produce(before, (draft) => {
        draft.blocks.push(action.block);
      });
      return { past: pushPast(history.past, before), present, future: [] };
    }
    case "REMOVE_BLOCK": {
      const before = history.present;
      const present = produce(before, (draft) => {
        draft.blocks = draft.blocks.filter((b) => b.id !== action.id);
      });
      return { past: pushPast(history.past, before), present, future: [] };
    }
    case "UPDATE_BLOCK": {
      const before = history.present;
      const present = applyBlockPatch(before, action.id, action.patch);
      return { past: pushPast(history.past, before), present, future: [] };
    }
    case "UPDATE_BLOCK_LIVE": {
      // Visual feedback only during a drag/resize gesture — never pushed to history.
      const present = applyBlockPatch(history.present, action.id, action.patch);
      return { ...history, present };
    }
    case "COMMIT": {
      // `present` already reflects the final live-updated value; only the
      // pre-gesture snapshot needs to land in `past`.
      if (action.before === history.present) return history;
      return { past: pushPast(history.past, action.before), present: history.present, future: [] };
    }
    case "UNDO": {
      if (history.past.length === 0) return history;
      const previous = history.past[history.past.length - 1];
      return {
        past: history.past.slice(0, -1),
        present: previous,
        future: [history.present, ...history.future],
      };
    }
    case "REDO": {
      if (history.future.length === 0) return history;
      const next = history.future[0];
      return {
        past: pushPast(history.past, history.present),
        present: next,
        future: history.future.slice(1),
      };
    }
  }
}

export function useEditorState(initial: EditorState) {
  const [history, dispatch] = useReducer(reducer, { past: [], present: initial, future: [] });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const addBlock = useCallback((block: EditorBlock) => dispatch({ type: "ADD_BLOCK", block }), []);
  const removeBlock = useCallback((id: string) => dispatch({ type: "REMOVE_BLOCK", id }), []);
  const updateBlock = useCallback(
    (id: string, patch: Partial<EditorBlock>) => dispatch({ type: "UPDATE_BLOCK", id, patch }),
    [],
  );
  const updateBlockLive = useCallback(
    (id: string, patch: Partial<EditorBlock>) => dispatch({ type: "UPDATE_BLOCK_LIVE", id, patch }),
    [],
  );
  const commitBlock = useCallback((before: EditorState) => dispatch({ type: "COMMIT", before }), []);
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);
  const selectBlock = useCallback((id: string | null) => setSelectedBlockId(id), []);

  return useMemo(
    () => ({
      state: history.present,
      selectedBlockId,
      selectBlock,
      addBlock,
      removeBlock,
      updateBlock,
      updateBlockLive,
      commitBlock,
      undo,
      redo,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
    }),
    [
      history.present,
      history.past.length,
      history.future.length,
      selectedBlockId,
      selectBlock,
      addBlock,
      removeBlock,
      updateBlock,
      updateBlockLive,
      commitBlock,
      undo,
      redo,
    ],
  );
}
