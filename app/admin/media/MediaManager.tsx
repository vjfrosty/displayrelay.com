"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type MediaAsset = {
  id: string;
  name: string;
  publicUrl: string;
  thumbnailUrl: string | null;
  mimeType: string;
  sizeBytes: number;
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaManager({ clientId }: { clientId: string }) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssets = useCallback(async () => {
    const res = await fetch(`/api/v1/clients/${clientId}/media`);
    if (res.ok) {
      const data = await res.json();
      setAssets(data.items);
    }
  }, [clientId]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/v1/clients/${clientId}/media`, { method: "POST", body: formData });
    setUploading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Upload failed.");
      return;
    }
    await loadAssets();
  }

  async function handleDelete(assetId: string) {
    const res = await fetch(`/api/v1/clients/${clientId}/media/${assetId}`, { method: "DELETE" });
    if (res.ok) await loadAssets();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <>
      <div
        className={`media-dropzone${dragOver ? " media-dropzone-active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <p>{uploading ? "Uploading…" : "Drag a file here, or click to choose one"}</p>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="error-text">{error}</p>}

      <div className="media-grid">
        {assets.length === 0 && <p className="lead">No media yet.</p>}
        {assets.map((asset) => (
          <div className="media-tile" key={asset.id}>
            {asset.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.thumbnailUrl} alt={asset.name} className="media-thumb" />
            ) : (
              <div className="media-thumb media-thumb-placeholder">{asset.mimeType}</div>
            )}
            <p className="media-name">{asset.name}</p>
            <p className="media-meta">{formatSize(asset.sizeBytes)}</p>
            <button className="button secondary" onClick={() => handleDelete(asset.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
