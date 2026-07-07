export interface DocumentEntity {
  people: string[];
  places: string[];
  events: string[];
}

export interface ProjectDocument {
  id: number;
  name: string;
  url: string;
  type: string;
  content: string;
  summary: string | null;
  entities: DocumentEntity;
  projectId: number;
  createdAt: string;
}

export async function getDocuments(projectId: number) {
  const res = await fetch(`/api/documents?projectId=${projectId}`);

  if (!res.ok) {
    throw new Error("Failed to load documents");
  }

  return (await res.json()) as ProjectDocument[];
}

export async function uploadDocument(
  projectId: number,
  file: File
) {
  const formData = new FormData();

  formData.append("projectId", String(projectId));
  formData.append("file", file);

  const res = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return data as ProjectDocument;
}

export async function deleteDocument(id: number) {
  const res = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Delete failed");
  }
}