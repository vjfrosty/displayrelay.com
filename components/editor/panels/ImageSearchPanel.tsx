"use client";

import { useState } from "react";
import type { useEditorState } from "@/hooks/useEditorState";

type EditorApi = ReturnType<typeof useEditorState>;

type SearchResult = {
  id: string;
  provider: "pexels";
  src: string;
  thumbnailSrc: string;
  width: number;
  height: number;
  attribution: string;
};

type Status = "idle" | "loading" | "error" | "blocked";

export function ImageSearchPanel({
  clientId,
  blockId,
  editor,
}: {
  clientId: string;
  blockId: string;
  editor: EditorApi;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/v1/clients/${clientId}/image/search?query=${encodeURIComponent(query)}`);
      if (res.status === 403) {
        const body = (await res.json()) as { upgradeUrl?: string };
        setStatus("blocked");
        setUpgradeUrl(body.upgradeUrl ?? null);
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const body = (await res.json()) as { results: SearchResult[] };
      setResults(body.results);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  function handleSelect(result: SearchResult) {
    editor.updateBlock(blockId, {
      props: {
        src: result.src,
        objectFit: "cover",
        attribution: result.attribution,
        pexelsId: result.id,
        provider: result.provider,
      },
    });
    editor.addBlock({
      id: `attribution-${result.id}-${Date.now()}`,
      type: "text",
      x: 2,
      y: 94,
      width: 60,
      height: 5,
      zIndex: editor.state.blocks.length + 1,
      locked: true,
      visible: true,
      props: {
        content: result.attribution,
        fontSize: 14,
        fontWeight: "400",
        fontFamily: "sans-serif",
        color: "#ffffff",
        align: "left",
        lineHeight: 1.2,
      },
    });
  }

  return (
    <div className="image-search-panel">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Pexels…"
        />
        <button className="button" type="submit" disabled={status === "loading"}>
          Search
        </button>
      </form>
      {status === "blocked" && (
        <p className="error-text">
          Image search quota exceeded.{" "}
          {upgradeUrl && <a href={upgradeUrl}>Upgrade plan</a>}
        </p>
      )}
      {status === "error" && <p className="error-text">Image search failed. Try again.</p>}
      <div className="image-search-grid">
        {results.map((result) => (
          <button key={result.id} type="button" className="image-search-result" onClick={() => handleSelect(result)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- search-result thumbnail preview */}
            <img src={result.thumbnailSrc} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}
