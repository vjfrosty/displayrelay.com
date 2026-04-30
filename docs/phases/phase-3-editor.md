# Phase 3 — Slide Editor (Weeks 5–8)

The slide editor is the most technically complex part of Phase 3. Tackle it in the order shown. Do not try to build the entire editor in one task. Task 3.1 establishes the data model and renderer, Task 3.2 adds canvas interactions, Task 3.3 adds the editable block system, and Task 3.4 closes the save and versioning loop.

## Phase 3 Dependencies

- Task 3.1 depends on Task 1.2 because the `Template` table must exist.
- Task 3.2 depends on Task 3.1.
- Task 3.3 depends on Task 3.2 and `lib/storage.ts` from Task 2.2.
- Task 3.4 depends on Tasks 3.1 through 3.3.

## Recommended Packages And Versions

Keep the Phase 1 platform baseline pinned. Add only the packages below for Phase 3 work.

| Package | Recommended version | Used for |
|---|---|---|
| `react-draggable` | 4.5.0 | Drag-to-move interactions on the editor canvas. |
| `immer` | 11.1.4 | Immutable editor-state updates and undo/redo history. |
| `isomorphic-dompurify` | 3.11.0 | SSR-safe sanitization before rendered HTML is stored or returned. |
| `puppeteer` | 24.42.0 | Template thumbnail generation in Task 3.4. |

## Related Targeted Instructions

- `.github/instructions/editor-contracts.instructions.md` for `EditorState` invariants, renderer purity, sanitization, and percentage-based positioning.
- `.github/instructions/ai-generation.instructions.md` for image-search usage gating and provider-call discipline.

## Phase-Specific Notes

- Stay with the documented custom React canvas approach for this phase. Do not add `fabric` unless you intentionally change the editor architecture.
- If you later replace the custom canvas with Fabric.js, use `fabric` 7.3.1 and add an explicit SVG sanitization review before shipping.

## TASK 3.1 EditorState Type + `lib/editor.ts` Renderer

**Copilot Agent:** `Canvas`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 9.3 (EditorState type) and Section 14.7 (`renderEditorHtml`). Build the data model and renderer before any UI.

**Inputs (what must exist first):**
- Task 1.2 complete.
- `Template` table exists.

**Outputs (what this task produces):**
- `types/editor.ts`
- `lib/editor.ts`
- `lib/validation/sanitizeHtml.ts`
- Unit tests for `renderEditorHtml`

**Copilot prompts — paste these in sequence:**
1. Create `types/editor.ts` with `EditorState`, `EditorBlock`, `TextBlockProps`, `ImageBlockProps`, `ShapeBlockProps`, `LogoBlockProps`, and `BackgroundConfig` exactly as defined in Section 9.3.
2. Create `lib/validation/sanitizeHtml.ts` importing `isomorphic-dompurify` and exporting `sanitizeHtml(input: string): string`.
3. Create `lib/editor.ts` implementing `renderEditorHtml(state: EditorState)` to sort blocks by `zIndex`, render each block type, and apply percentage-based positioning.
4. Ensure logo blocks output `<img src="{{LOGO_URL}}"` so the logo placeholder is replaced later at display time.
5. Write tests proving that a text block renders correct text, an image block renders an `img` tag, and the renderer stays pure for identical input.

**Done when:**
- `renderEditorHtml()` returns valid HTML for a simple color-background slide.
- A text block containing `<script>alert(1)</script>` is sanitized.
- Logo blocks render `{{LOGO_URL}}` instead of a literal asset URL.

**Common pitfalls:**
- Do not use `Date.now()` or random values in `renderEditorHtml()`; it must be pure.
- Percentage positions mean `left:10%`, not `left:10px`.
- Use `isomorphic-dompurify`, not browser-only DOMPurify, so SSR remains compatible.

**Validation before moving on:**
- Run the same `EditorState` through `renderEditorHtml()` repeatedly and verify byte-identical output.
- Verify percentage-based positioning is preserved in the output HTML.

---

## TASK 3.2 Editor Canvas — React Component

**Copilot Agent:** `Canvas`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 14.1 (editor layout) and Section 14.2 (block types). The canvas is the drag-and-drop editing area.

**Inputs (what must exist first):**
- Task 3.1 complete.
- `types/editor.ts` defined.
- Client Component environment ready.

**Outputs (what this task produces):**
- `components/editor/EditorCanvas.tsx`
- `hooks/useEditorState.ts`
- Working selection, drag, resize, undo, and redo behavior

**Copilot prompts — paste these in sequence:**
1. Create `hooks/useEditorState.ts` using immer for immutable updates. Implement `addBlock`, `updateBlock`, `removeBlock`, `moveBlock`, `resizeBlock`, `undo`, and `redo`. Keep the last 50 states.
2. Create `components/editor/EditorCanvas.tsx` as a Client Component with a 16:9 ratio canvas using `position: relative` and `padding-top: 56.25%`.
3. Implement click-to-select so clicking a block sets `selectedBlockId` in state.
4. Implement drag-to-move using `react-draggable`, converting pixel deltas to percentages of canvas width and height.
5. Implement eight resize handles and convert pixel resize deltas to percentages.

**Done when:**
- Dragging a text block updates `EditorState` using percentages.
- Undo with `Ctrl+Z` reverts the last move.
- Selecting a block reveals resize handles, and resizing updates width and height correctly.

**Common pitfalls:**
- `react-draggable` gives pixel deltas, so convert them with the canvas dimensions.
- Use a stable `ref` for the canvas dimensions instead of `window.innerWidth`.
- Do not push every drag-move into history; only commit history on drag end.

**Validation before moving on:**
- Verify drag and resize do not switch values back to pixels.
- Verify undo and redo work after both a move and a resize.

---

## TASK 3.3 Block Types — Text, Image, Shape, Logo

**Copilot Agent:** `Canvas` + `UI`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 14.2 (block types), Section 14.3 (inline image search), and Section 23 (branding CSS variables).

**Inputs (what must exist first):**
- Task 3.2 complete.
- `lib/storage.ts` from Task 2.2 working.
- Pexels API key set.

**Outputs (what this task produces):**
- `components/editor/blocks/TextBlock.tsx`
- `components/editor/blocks/ImageBlock.tsx`
- `components/editor/blocks/ShapeBlock.tsx`
- `components/editor/blocks/LogoBlock.tsx`
- `components/editor/panels/ImageSearchPanel.tsx`
- `components/editor/EditorProperties.tsx`

**Copilot prompts — paste these in sequence:**
1. Create `TextBlock.tsx` with a `contenteditable` div using `fontSize`, `fontFamily`, `color`, and `align` from props.
2. Create `ImageBlock.tsx` rendering an `img` with `objectFit` from props, and open `ImageSearchPanel` when the selected block is clicked.
3. Create `ImageSearchPanel.tsx` that calls `GET /api/v1/clients/:clientId/image/search`, shows results in a grid, and updates `ImageBlockProps` on selection.
4. Create `ShapeBlock.tsx` rendering an SVG rect or circle using fill and stroke from props.
5. Create `LogoBlock.tsx` that reads branding context and renders `branding.logoUrl`, with a placeholder fallback.
6. Create `EditorProperties.tsx` as the right-hand properties panel with controls based on the selected block type.

**Done when:**
- Text blocks update their content in `EditorState` while typing.
- Searching `mountain` returns image results and selecting one sets the image block source.
- Logo blocks render the client logo.
- Changing font size in the properties panel updates the selected block immediately.

**Common pitfalls:**
- In React, use `onInput` with `contenteditable`, not `onChange`, and set `suppressContentEditableWarning={true}`.
- `ImageSearchPanel` must call `checkAndIncrement("image_searches")` before the provider call.
- Branding CSS variables belong on the canvas wrapper via CSS custom properties.

**Validation before moving on:**
- Verify `image_searches` usage is gated before outbound provider calls.
- Verify branding variables apply to rendered blocks without inline one-off styling.

---

## TASK 3.4 Editor Save Flow + Template API

**Copilot Agent:** `Canvas`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 14.6 (save flow) and Section 15.6 (template API).

**Inputs (what must exist first):**
- Tasks 3.1 through 3.3 complete.
- `Template` table from Task 1.2 available.

**Outputs (what this task produces):**
- `POST /api/v1/clients/:clientId/editor/save`
- `GET /api/v1/clients/:clientId/templates`
- `POST /api/v1/clients/:clientId/templates`
- `PATCH /api/v1/clients/:clientId/templates/:id`
- `DELETE /api/v1/clients/:clientId/templates/:id`
- `GET /api/v1/clients/:clientId/templates/:id/versions`
- `POST /api/v1/clients/:clientId/templates/:id/versions/:version/restore`

**Copilot prompts — paste these in sequence:**
1. Create `POST /api/v1/clients/:clientId/editor/save` to call `renderEditorHtml(editorState)`, upsert the `Template` row, create a `TemplateVersion` row, and return `{ template, version }`.
2. Add thumbnail generation using puppeteer to screenshot the rendered HTML at 1920x1080 and resize to 400x225. A placeholder thumbnail is acceptable initially.
3. Create the full template CRUD API matching Section 15.6 with list filters, fetch by id, create, update, and delete operations.
4. Create `GET /api/v1/clients/:clientId/templates/:id/versions` returning all `TemplateVersion` rows for a template.
5. Create `POST /api/v1/clients/:clientId/templates/:id/versions/:version/restore` to copy a previous version's `editorState` back to the `Template` row.

**Done when:**
- Saving a template creates `TemplateVersion` version `1`.
- Editing and saving again increments the version to `2`.
- Restoring version `1` creates a new version that brings the old state back.
- Filtering templates by `vertical=dental-clinic` returns only dental templates.

**Common pitfalls:**
- Template versioning must be atomic; if HTML rendering fails, do not save a partial template state.
- Puppeteer can bloat the app image, so isolate thumbnail generation if needed.
- Preserve `forkedFromId` when editing existing templates.

**Validation before closing the phase:**
- Save, edit, and restore a template and verify version history stays consistent.
- Verify template filters still respect client scoping and vertical filtering.

## Phase 3 Completion Gate

Do not close Phase 3 until all of the following are true:

- `renderEditorHtml()` is pure for identical `EditorState` input.
- XSS sanitization is verified for editor text content.
- Percentage-based positioning survives drag, resize, save, and restore flows.
- `image_searches` usage gating is enforced before provider calls.
- `docs/phases/results/phase-3-result.md` is generated with architecture, validation results, and follow-up notes.