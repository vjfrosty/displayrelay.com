"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorProperties } from "@/components/editor/EditorProperties";
import { BrandingProvider, type ClientBranding } from "@/components/editor/BrandingContext";
import { useEditorState } from "@/hooks/useEditorState";
import type { EditorState } from "@/types/editor";

const BLANK_STATE: EditorState = {
  version: 1,
  width: 1920,
  height: 1080,
  orientation: "landscape",
  background: { type: "color", value: "#0f172a" },
  blocks: [
    {
      id: "text-1",
      type: "text",
      x: 8,
      y: 12,
      width: 60,
      height: 20,
      zIndex: 1,
      locked: false,
      visible: true,
      props: {
        content: "Welcome to Display Relay",
        fontSize: 64,
        fontWeight: "700",
        fontFamily: "sans-serif",
        color: "#ffffff",
        align: "left",
        lineHeight: 1.15,
      },
    },
    {
      id: "shape-1",
      type: "shape",
      x: 70,
      y: 55,
      width: 22,
      height: 30,
      zIndex: 2,
      locked: false,
      visible: true,
      props: {
        shape: "rectangle",
        fill: "#a14b21",
        radius: 12,
      },
    },
  ],
  meta: { duration: 8, transition: "fade" },
};

type InitialTemplate = { id: string; name: string; editorState: EditorState };

export function EditorHarness({
  clientId,
  branding,
  initialTemplate,
}: {
  clientId: string;
  branding: ClientBranding;
  initialTemplate?: InitialTemplate;
}) {
  const router = useRouter();
  const editor = useEditorState(initialTemplate?.editorState ?? BLANK_STATE);
  const { addBlock, undo, redo, canUndo, canRedo } = editor;
  const [counter, setCounter] = useState(0);
  const [templateId, setTemplateId] = useState<string | null>(initialTemplate?.id ?? null);
  const [name, setName] = useState(initialTemplate?.name ?? "Untitled Template");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">("idle");
  const [savedVersion, setSavedVersion] = useState<number | null>(null);

  function nextId(prefix: string) {
    const id = `${prefix}-${counter}`;
    setCounter((c) => c + 1);
    return id;
  }

  function handleAddText() {
    addBlock({
      id: nextId("text-new"),
      type: "text",
      x: 10,
      y: 10,
      width: 40,
      height: 15,
      zIndex: editor.state.blocks.length + 1,
      locked: false,
      visible: true,
      props: {
        content: "New text block",
        fontSize: 40,
        fontWeight: "600",
        fontFamily: "sans-serif",
        color: "#1f1a17",
        align: "left",
        lineHeight: 1.2,
      },
    });
  }

  function handleAddShape() {
    addBlock({
      id: nextId("shape-new"),
      type: "shape",
      x: 20,
      y: 20,
      width: 20,
      height: 20,
      zIndex: editor.state.blocks.length + 1,
      locked: false,
      visible: true,
      props: {
        shape: "circle",
        fill: "#7c3415",
      },
    });
  }

  function handleAddImage() {
    addBlock({
      id: nextId("image-new"),
      type: "image",
      x: 15,
      y: 15,
      width: 40,
      height: 30,
      zIndex: editor.state.blocks.length + 1,
      locked: false,
      visible: true,
      props: {
        src: "",
        objectFit: "cover",
      },
    });
  }

  function handleAddLogo() {
    addBlock({
      id: nextId("logo-new"),
      type: "logo",
      x: 80,
      y: 5,
      width: 15,
      height: 15,
      zIndex: editor.state.blocks.length + 1,
      locked: false,
      visible: true,
      props: { scale: 1 },
    });
  }

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/v1/clients/${clientId}/editor/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: templateId ?? undefined, name, editorState: editor.state }),
      });
      if (!res.ok) {
        setSaveStatus("error");
        return;
      }
      const body = (await res.json()) as { template: { id: string }; version: { version: number } };
      setSavedVersion(body.version.version);
      setSaveStatus("idle");
      if (!templateId) {
        setTemplateId(body.template.id);
        router.replace(`/admin/editor/${body.template.id}`);
      }
    } catch {
      setSaveStatus("error");
    }
  }

  return (
    <BrandingProvider branding={branding}>
      <div className="editor-toolbar">
        <input
          className="editor-name-input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Template name"
        />
        <button className="button" type="button" onClick={handleSave} disabled={saveStatus === "saving"}>
          {saveStatus === "saving" ? "Saving…" : "Save"}
        </button>
        {savedVersion !== null && <span className="save-status">Saved as version {savedVersion}</span>}
        {saveStatus === "error" && <span className="error-text">Save failed</span>}
        <button className="button secondary" type="button" onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button className="button secondary" type="button" onClick={redo} disabled={!canRedo}>
          Redo
        </button>
        <button className="button" type="button" onClick={handleAddText}>
          Add Text Block
        </button>
        <button className="button" type="button" onClick={handleAddShape}>
          Add Shape Block
        </button>
        <button className="button" type="button" onClick={handleAddImage}>
          Add Image Block
        </button>
        <button className="button" type="button" onClick={handleAddLogo}>
          Add Logo Block
        </button>
      </div>
      <div className="editor-layout">
        <EditorCanvas editor={editor} />
        <EditorProperties clientId={clientId} editor={editor} />
      </div>
    </BrandingProvider>
  );
}
