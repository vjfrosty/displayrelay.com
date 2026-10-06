import { describe, expect, it } from "vitest";
import { reducer, type History } from "./useEditorState";
import type { EditorBlock, EditorState } from "@/types/editor";

// The undo/redo/live-update logic is exercised directly against the exported
// reducer (rather than mounting the hook) since this project has no
// DOM-rendering test infrastructure — the interactive drag/resize/undo UX
// itself is verified live in the browser per the ORCHESTRATOR convention.

const BASE_STATE: EditorState = {
  version: 1,
  width: 1920,
  height: 1080,
  orientation: "landscape",
  background: { type: "color", value: "#000000" },
  blocks: [],
  meta: { duration: 8, transition: "fade" },
};

function textBlock(overrides: Partial<EditorBlock> = {}): EditorBlock {
  return {
    id: "text-1",
    type: "text",
    x: 10,
    y: 10,
    width: 30,
    height: 20,
    zIndex: 1,
    locked: false,
    visible: true,
    props: {
      content: "Hello",
      fontSize: 40,
      fontWeight: "600",
      fontFamily: "sans-serif",
      color: "#fff",
      align: "left",
      lineHeight: 1.2,
    },
    ...overrides,
  };
}

function baseHistory(state: EditorState = BASE_STATE): History {
  return { past: [], present: state, future: [] };
}

describe("useEditorState reducer", () => {
  it("ADD_BLOCK appends the block and pushes history", () => {
    const history = baseHistory();
    const block = textBlock();
    const next = reducer(history, { type: "ADD_BLOCK", block });

    expect(next.present.blocks).toEqual([block]);
    expect(next.past).toEqual([BASE_STATE]);
    expect(next.future).toEqual([]);
  });

  it("UPDATE_BLOCK_LIVE mutates present without growing history", () => {
    const withBlock = reducer(baseHistory(), { type: "ADD_BLOCK", block: textBlock() });
    const live = reducer(withBlock, {
      type: "UPDATE_BLOCK_LIVE",
      id: "text-1",
      patch: { x: 25, y: 40 },
    });

    expect(live.present.blocks[0]).toMatchObject({ x: 25, y: 40 });
    expect(live.past).toEqual(withBlock.past);
    expect(live.past.length).toBe(1);
  });

  it("COMMIT after a live drag grows history by exactly one entry and clears future", () => {
    const withBlock = reducer(baseHistory(), { type: "ADD_BLOCK", block: textBlock() });
    const preDragSnapshot = withBlock.present;
    const live = reducer(withBlock, {
      type: "UPDATE_BLOCK_LIVE",
      id: "text-1",
      patch: { x: 25, y: 40 },
    });
    const withRedoAvailable = { ...live, future: [BASE_STATE] };
    const committed = reducer(withRedoAvailable, { type: "COMMIT", before: preDragSnapshot });

    expect(committed.past).toEqual([...withBlock.past, preDragSnapshot]);
    expect(committed.past.length).toBe(withBlock.past.length + 1);
    expect(committed.future).toEqual([]);
    expect(committed.present.blocks[0]).toMatchObject({ x: 25, y: 40 });
  });

  it("UNDO restores the exact prior percentages after a committed move", () => {
    const withBlock = reducer(baseHistory(), { type: "ADD_BLOCK", block: textBlock() });
    const preDragSnapshot = withBlock.present;
    const live = reducer(withBlock, {
      type: "UPDATE_BLOCK_LIVE",
      id: "text-1",
      patch: { x: 25, y: 40 },
    });
    const committed = reducer(live, { type: "COMMIT", before: preDragSnapshot });
    const undone = reducer(committed, { type: "UNDO" });

    expect(undone.present).toEqual(preDragSnapshot);
    expect(undone.present.blocks[0]).toMatchObject({ x: 10, y: 10 });
  });

  it("REDO after UNDO restores the moved position", () => {
    const withBlock = reducer(baseHistory(), { type: "ADD_BLOCK", block: textBlock() });
    const preDragSnapshot = withBlock.present;
    const live = reducer(withBlock, {
      type: "UPDATE_BLOCK_LIVE",
      id: "text-1",
      patch: { x: 25, y: 40 },
    });
    const committed = reducer(live, { type: "COMMIT", before: preDragSnapshot });
    const undone = reducer(committed, { type: "UNDO" });
    const redone = reducer(undone, { type: "REDO" });

    expect(redone.present.blocks[0]).toMatchObject({ x: 25, y: 40 });
  });

  it("UNDO/REDO are no-ops at the boundaries of history", () => {
    const history = baseHistory();
    expect(reducer(history, { type: "UNDO" })).toBe(history);
    expect(reducer(history, { type: "REDO" })).toBe(history);
  });

  it("caps past history at 50 entries", () => {
    let history = baseHistory();
    for (let i = 0; i < 60; i++) {
      history = reducer(history, {
        type: "UPDATE_BLOCK",
        id: "text-1",
        patch: { x: i },
      });
    }
    expect(history.past.length).toBe(50);
  });

  it("REMOVE_BLOCK drops the block and pushes history", () => {
    const withBlock = reducer(baseHistory(), { type: "ADD_BLOCK", block: textBlock() });
    const removed = reducer(withBlock, { type: "REMOVE_BLOCK", id: "text-1" });

    expect(removed.present.blocks).toEqual([]);
    expect(removed.past.length).toBe(withBlock.past.length + 1);
  });

  it("never introduces pixel values — all position/size patches stay in the percentage fields", () => {
    const withBlock = reducer(baseHistory(), { type: "ADD_BLOCK", block: textBlock() });
    const resized = reducer(withBlock, {
      type: "UPDATE_BLOCK_LIVE",
      id: "text-1",
      patch: { x: 5, y: 5, width: 50, height: 50 },
    });
    const block = resized.present.blocks[0];

    for (const value of [block.x, block.y, block.width, block.height]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});
