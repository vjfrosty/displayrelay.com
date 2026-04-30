---
description: "Use when working on EditorState, renderEditorHtml, editor blocks, drag and resize behavior, sanitization, or canvas save/restore flows for Display Relay."
name: "Editor Contracts"
applyTo:
  - "types/editor.ts"
  - "lib/editor.ts"
  - "lib/validation/sanitizeHtml.ts"
  - "components/editor/**"
  - "hooks/useEditorState.ts"
---

# Editor Contracts

- Keep `EditorState` resolution-independent by storing position and size values as percentages.
- Never persist absolute pixel coordinates in `EditorState`.
- `renderEditorHtml()` must be pure: no randomness, timestamps, hidden mutation, or side effects.
- Sort blocks by `zIndex` before rendering.
- Sanitize editor HTML with `isomorphic-dompurify` so SSR-safe sanitization works consistently.
- Keep branding through CSS custom properties rather than one-off inline styling.
- Render logo placeholders as `{{LOGO_URL}}` for display-time substitution.
- Preserve percentage-based values through drag, resize, save, restore, and versioning flows.
