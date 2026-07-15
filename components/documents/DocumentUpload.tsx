"use client";

import { useRef, useState } from "react";

type Props = {
  projectId: number;
  onUploaded: () => void;
};

export default function DocumentUpload({
  projectId,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  async function upload() {
    if (!file) return;

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("projectId", String(projectId));

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMessage("✅ File uploaded successfully");

      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      onUploaded();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">

      <h2 className="mb-4 text-xl font-bold">
        Upload Document
      </h2>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="mb-4 block w-full rounded border border-gray-300 bg-white p-2 text-black"
        onChange={(e) => {
          const selected = e.target.files?.[0];

          if (!selected) return;

          if (!allowedTypes.includes(selected.type)) {
            alert("Only PDF and Word files are allowed.");

            return;
          }

          setFile(selected);
        }}
      />

      {file && (
        <div className="mb-4 rounded bg-gray-100 p-3">

          <div className="font-semibold">
            {file.name}
          </div>

          <div className="text-sm text-gray-600">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>

        </div>
      )}

      <button
        onClick={upload}
        disabled={!file || uploading}
        className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {message && (
        <p className="mt-4 text-sm">
          {message}
        </p>
      )}

    </div>
  );
}