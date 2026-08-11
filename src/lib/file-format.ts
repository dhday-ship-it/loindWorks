export function fmtFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export async function uploadFile(file: File, projectId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("projectId", projectId);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "업로드에 실패했습니다.");
  }
  return res.json() as Promise<{
    name: string;
    url: string;
    size: number;
    mimeType: string | null;
  }>;
}
